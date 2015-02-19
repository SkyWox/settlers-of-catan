var uuid = require('node-uuid');
var mysql = require('mysql');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io', {
    'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
})(http);
io.set('resource', '/projects/soc/sock/socket.io');
app.set('trust proxy', 'loopback, 127.0.0.1');

var dbPool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'catan',
    password: 'DwE5t8cA3EhSMD3x',
    database: 'catan'
});

var active_games = [];
var players = {};

/*
    game: {
            code: 1234567asdasdas,
            players: [uniqid1, uniqid2, uniqid3],
            maptype: beginner|variable,
            state: {
                        tiles: [list of mountain|hill|desert|forest|pasture|field],
                        robber: int,
                        num: [list of int],
                        turn: int
                   }
          }
*/

function emitGameState(game) {
    var sockets = [];
    g2 = game.clone();
    for (var i=0; i<g2.players.length; i++) {
        var uuid = g2.players[i];
        sockets[i] = players[uuid];

        g2[i] = { uuid: uuid, nickname: sockets[i].nickname };
    }

    for (var i=0; i<sockets.length; i++) {
        sockets[i].emit('game state', g2);
    }
}

io.on('connection', function(socket) {
    // Register all of the listeners for client->server communication

    socket.uuid = uuid.v4();
    players[socket.uuid] = socket;

    socket.emit('uuid', socket.uuid);

    socket.on('new game', function(data) {
        console.log("new game - " + data.players + ", " + data.variable);
    });

    socket.on('join game', function(code) {
        console.log("join game - " + code);
    });

    socket.on('debug', function(msg) {
        console.log('\tDEBUG: ' + msg);
    });

    socket.on('nickname', function(name) {
        socket.nickname = name;
        console.log(socket.uuid + " [" + socket.nickname + "] connected");
    });

});

http.listen(process.env.PORT || 3000, function() {
    console.log('listening on *:3000');
});
