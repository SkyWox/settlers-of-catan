String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var Game = {}

Game.scale = 0.075;
Game.chitRadius = 200;
Game.debug = true;
Game.connected = false;
Game.inited = false;

Game.canvas = new fabric.StaticCanvas('c', {
    imageSmoothingEnabled: false
});
Game.requiredAssets = {
    tile_forest: "img/forest.png",
    tile_desert: "img/desert.png",
    tile_field: "img/field.png",
    tile_hill: "img/hill.png",
    tile_mountain: "img/mountain.png",
    tile_pasture: "img/pasture.png",
    tile_sea: "img/sea.png",
    robber: "img/robber.png",
    card_res_brick: "img/res_brick.png",
    card_res_grain: "img/res_grain.png",
    card_res_lumber: "img/res_lumber.png",
    card_res_ore: "img/res_ore.png",
    card_res_wool: "img/res_wool.png"
};
Game.tileCoords = [{x: 0, y: 3},{x: 1, y: 3.5},{x: 2, y: 4},{x: 3, y: 3.5},{x: 4, y: 3},{x: 4, y: 2},{x: 4, y: 1},{x: 3, y: 0.5},{x: 2, y: 0},{x: 1, y: 0.5},{x: 0, y: 1},{x: 0, y: 2},{x: 1, y: 2.5},{x: 2, y: 3},{x: 3, y: 2.5},{x: 3, y: 1.5},{x: 2, y: 1},{x: 1, y: 1.5},{x: 2, y: 2}];
Game.numFrequency = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1
};
Game.elements = {
    robber: undefined,
    numberChits: [],
    tiles: []
}

Game.rand = (function(min, max) {
    return Math.random() * (max - min) + min;
});

Game.resizeCanvas = (function() {
    Game.canvas.setHeight(window.innerHeight);
    Game.canvas.setWidth(window.innerWidth - 300);
    Game.canvas.renderAll();
});

Game.dbgtxt = (function(text) {
    console.log(text);
});

Game.loadAsset = (function(asset, url) {
    if (url.endsWith(".svg")) {
        // Attempt to load it as a SVG
        fabric.loadSVGFromURL(url, function(objects, options) {
            var obj = fabric.util.groupSVGElements(objects, options);
            Game.loadedAssets[asset] = obj;
        });
    }

    else if (url.endsWith(".png")) {
        fabric.Image.fromURL(url, function(img) {
            Game.loadedAssets[asset] = img;
        });
    }

    else {
        Game.dbgtxt("UNKNOWN ASSET TYPE");
        Game.loadedAssets[asset] = undefined;
    }
});

Game.loadAssets = (function() {
    // Mark it as not loaded
    Game.loaded = false;
    Game.loadedAssets = {};

    // Load all of them
    for (var asset in Game.requiredAssets) {
        var url = Game.requiredAssets[asset];
        Game.loadAsset(asset, url);
    }
});

Game.checkLoaded = (function() {
    if (Game.loaded) {
        return true;
    }

    var loaded = true;
    for (var asset in Game.requiredAssets) {
        if (!(asset in Game.loadedAssets)) {
            loaded = false;
        }
    }

    Game.loaded = loaded;
    return loaded;
});

Game.asset = (function(name) {
    if (!(name in Game.loadedAssets)) {
        return undefined;
    }

    var a = Game.loadedAssets[name];
    if (a === false || a === undefined) {
        return undefined;
    }

    return fabric.util.object.clone(a);
});

Game.setupBoard = (function() {
    // Add the tiles
    Game.canvas.clear();

    // Draw the board tiles
    for (var idx in Game.boardState['tiles']) {
        Game.addTile(Game.boardState['tiles'][idx], idx);
    }

    // Draw the number chits
    for (var idx in Game.boardState['num']) {
        Game.addChit(idx, Game.boardState['num'][idx]);
    }

    Game.addRobber(Game.boardState['robber']);
});

Game.addTile = (function(tile, idx) {
    var asset = Game.asset("tile_" + tile);
    var pos = Game.tileToXY(idx);
    asset.set("scaleX", Game.scale).set("scaleY", Game.scale).set('left', pos.left).set('top', pos.top);
    Game.canvas.add(asset);
    Game.elements['tiles'][idx] = asset;
});

Game.addChit = (function(idx, num) {
    if (num === undefined) return;

    var pos = Game.tileToXY(idx);

    var left = pos.left + (Game.tileWidth/2 + Game.rand(-Game.chitRadius, Game.chitRadius)) * Game.scale;
    var top = pos.top + (Game.tileHeight/2 + Game.rand(-Game.chitRadius, Game.chitRadius)) * Game.scale;

    var group = new fabric.Group([], {left: left, top: top, scaleX: Game.scale, scaleY: Game.scale, angle: Game.rand(-70, 70)});

    var circle = new fabric.Circle({
        radius: Game.chitRadius,
        originX: 'center',
        originY: 'center',
        fill: 'white',
        shadow: {
            color: "rgba(0,0,0,0.5)",
            blur: 0.5,
            offsetX: 1,
            offsetY: 1
        }
    });
    group.add(circle);

    var colour = "black";
    if (num == 6 || num == 8) {
        colour = "red";
    }

    var text = new fabric.Text("" + num, {
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
        fontFamily: 'serif',
        fontWeight: 'bold',
        fill: colour,
        top: -Game.chitRadius/5,
        fontSize: Game.chitRadius
    });
    group.add(text);

    var freq = Game.numFrequency[num];
    var dotWidth = Game.chitRadius / 10;
    var gapWidth = Game.chitRadius / 7.5;
    var width = Math.max(dotWidth, (dotWidth * freq) + (gapWidth * (freq-1)));

    for (var i=0; i<freq; i++) {
        var left = (width * -0.5) + ((dotWidth + gapWidth) * i) - (dotWidth/2);

        var c = new fabric.Circle({
            radius: dotWidth,
            fill: colour,
            top: Game.chitRadius/2 - gapWidth,
            left: left
        });
        group.add(c);
    }

    Game.canvas.add(group);
    Game.elements['numberChits'][idx] = group;
});

Game.addRobber = (function(tile) {
    var asset = Game.asset("robber");
    var pos = Game.tileToXY(tile);
    asset.set('scaleX', Game.scale).set('scaleY', Game.scale).set('top', pos.top).set('left', pos.left);
    asset.set('shadow', new fabric.Shadow({
        color: "red",
        blur: 100 / Game.scale,
        offsetX: 1,
        offsetY: 1
    }));

    Game.canvas.add(asset);
    Game.elements['robber'] = asset;
});

Game.tileToXY = (function(idx) {
    var coords = Game.tileCoords[idx];
    return {left: (coords['x']+1) * 0.75 * (Game.tileWidth * Game.scale), top: (4-coords['y']+1) * (Game.tileHeight * Game.scale)};
});

// Calculate the required scale level to display the requested width/height object
Game.calculateScale = (function(width, height) {
    var canvasHeight = Game.canvas.getHeight();
    var canvasWidth = Game.canvas.getWidth();

    return Math.min(canvasWidth/width, canvasHeight/height);
});

Game.setResourceCardCount = (function(type, n) {
    var slots = $("div.card-slot");

    slots.each(function(i, slot) {
        var slot = $(this);
        if (slot.data('card-type') == type) {
            slot.empty();

            if (n <= 10) {
                for (var i=0; i<n; i++) {
                    slot.html(slot.html() + "<div class=\"card\" data-card-type=\"" + type + "\"></div>");
                }
            } else {
                for (var i=0; i<10; i++) {
                    slot.html(slot.html() + "<div class=\"card\" data-card-type=\"" + type + "\"></div>");
                }
                slot.html(slot.html() + "<div class=\"card\" data-card-type\"" + type + "\"><div class=\"quantity\">" + n + "</div></div>");
            }
        }
    });
});

Game.draw = (function() {
    //Game.dbgtxt("draw()");

    if (Game.state === undefined || Game.state === false) {
        return;
    }

    // Draw the board
    var newScale = Game.calculateScale(6 * Game.tileWidth, 7 * Game.tileHeight);
    if (newScale != Game.scale) {
        // We've changed the scale - do some scaling
        var oldScale = Game.scale;
        Game.scale = newScale;
        for (var i in Game.elements) {
            if (Game.elements[i] instanceof Array) {
                for (var j in Game.elements[i]) {
                    var elem = Game.elements[i][j];
                    elem.set('scaleX', Game.scale).set('scaleY', Game.scale).set('left', elem.left / oldScale * newScale).set('top', elem.top / oldScale * newScale);
                }
            }
            else {
                try {
                    var elem = Game.elements[i];
                    elem.set('scaleX', Game.scale).set('scaleY', Game.scale).set('left', elem.left / oldScale * newScale).set('top', elem.top / oldScale * newScale);
                } catch (Exception) {

                }
            }
        }
    }

    // Schedule the next draw
    setTimeout(Game.draw, 100);

});

Game.delayInit = (function() {

    // Wait for assets and the UUID
    if (!Game.checkLoaded() || !Game.uuid) {
        setTimeout(Game.delayInit, 100);
        return;
    }

    // Hide the loading screen
    Game.hideLoading();

    // Don't init it twice
    if (Game.inited) {
        Game.dbgtxt("delayInit(): Already inited");
        return;
    }

    // Get/Store the tile width
    var seaTile = Game.asset("tile_sea");
    Game.tileWidth = seaTile.getOriginalSize()['width'];
    Game.tileHeight = seaTile.getOriginalSize()['height'];

    // Resize the canvas automatically
    Game.resizeCanvas();
    setInterval(Game.resizeCanvas, 500);
    window.addEventListener('resize', Game.resizeCanvas, false);

    // Add button listeners
    $("#newGameCreate").click(function (event) {
        Game.newGame();
        return false;
    });
    $("#joinGame").click(function() {
        Game.joinGame($("input[name=existing]").val());
        return false;
    });

    // Start the render cycle
    Game.draw();

    Game.inited = true;
});

Game.disconnected = (function() {
    Game.connected = false;
    console.log("disconnected()");
    Game.showLoading("Reconnecting...");
});

Game.showLoading = (function(text) {
    if (text === undefined) {
        text = "Loading...";
    }

    $("#loading h1").text(text);
    $("#loading").show();
});

Game.hideLoading = (function() {
    $("#loading").hide();
});

Game.newGame = (function() {
    var data = {};
    data.players = $("select[name=players]").val();
    data.variable = $("#map_variable").is(':checked');
    Game.socket.emit('new game', data);
    $("#gameSetup").hide();
    Game.showLoading("Waiting for server...");
});

Game.joinGame = (function(code) {

    if (code === null || code === undefined || code.length != 36) {
        alert("Invalid game code format!");
        return;
    }

    Game.socket.emit('join game', code);
    $("#gameSetup").hide();
    Game.showLoading("Waiting for server...");
});

Game.init = (function() {
    Game.dbgtxt("init()");

    // Load nickname
    Game.nickname = $.cookie('soc_nickname');
    while (Game.nickname === undefined || Game.nickname === null || Game.nickname.trim() === "") {
        Game.nickname = prompt("Please enter a nickname");
    }
    $.cookie('soc_nickname', Game.nickname);

    // Setup socket.io socket
    localStorage.debug = 'socket.io-client:socket'

    // socket.io
    Game.connected = false;
    if (typeof(io) === "undefined") {
        Game.showLoading("Server is currently offline!");
        Game.dbgtxt("socket.io is undefined");
        return;
    }

    Game.showLoading("Connecting...");
    Game.socket = io.connect("http://jacobparry.ca:3000");
    Game.socket.on('uuid', function(uuid) {
        Game.uuid = uuid;
        Game.dbgtxt("UUID: " + Game.uuid);
        Game.socket.emit('nickname', Game.nickname);
    });
    Game.socket.on('connect', function() {
        Game.connected = true;

        // Load all of the required assets
        Game.showLoading("Loading assets...");
        Game.loadAssets();

        // Init the rest of the game
        Game.delayInit();
    });
    Game.socket.on('game state', function(gameState) {
        console.log("Game state updated");
        console.log(gameState);
    });
    Game.socket.on('disconnect', Game.disconnected);

    // This is the beginner board
    /*Game.boardState = {
        tiles: ["mountain", "hill", "desert", "hill", "forest", "pasture", "field", "pasture", "field", "mountain", "forest", "field", "pasture", "forest", "mountain", "hill", "forest", "pasture", "field"],
        robber: 2,
        num: [5,8,undefined,4,11,12,9,10,8,3,6,2,10,3,6,5,4,9,11]
    };*/
});
