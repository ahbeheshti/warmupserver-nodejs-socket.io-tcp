var express = require('express');
var GameMaker = require("./game.js");

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var pendingUsers = [];
var games = {};
var timeOfGame  = 60;

app.set('port', 3001);
server.listen(app.get('port'), function () {
    console.log("_______SERVER IS RUNNING_______");
});

var socketStatus =
    {
        IDLE: "0",
        SEARCHING: "1",
        IN_GAME: "2",
        GAME_ENDED: "3"
    };

io.on("connection", function(socket){

    socket.gameId = null;
    socket.status = socketStatus.IDLE;

    socket.on("request_game" , function(data){
        if (socket.status != socketStatus.IDLE) return;
        if (checkForSameInPending(socket.id)) return; //this can be removed
        console.log("request Game Requested");
        var name = data.name;
        addToPendingList(socket.id,name);
        socket.emit("request_game_accepted");
        socket.status = socketStatus.SEARCHING;
        checkForConnecting();
    });

    socket.on("unrequest_game" , function(){
        if (socket.status != socketStatus.SEARCHING) return;
        console.log("unrequest Game Requested");
        removeFromPendingList(socket.id);
        socket.emit("unrequest_game_accepted");
        socket.status = socketStatus.IDLE;
    });

    socket.on("update_game" , function(data){
        if(socket.status != socketStatus.IN_GAME) return ;
        // console.log("update score of player " +
        //     games[socket.gameId].getName(socket.id) +
        //     " with score " + data.score +
        //     " in game with id : " + socket.gameId );
        var score = data.score;
        games[socket.gameId].updateScore(socket.id , score, updateScoreCallBack);
    });

    socket.on("end_game" , function(data){
        if(socket.status != socketStatus.IN_GAME ) return ;
        console.log("game with id " + socket.gameId + " has ended for user " +
            games[socket.gameId].getName(socket.id) + " with score " + data.score );
        var score = data.score;
        games[socket.gameId].endGame(socket.id , score , endGameCallBack)
    });

    var updateScoreCallBack = function( opid , score) {
        var d = new Date();
        var serverTime = d.getUTCSeconds() + "," + d.getUTCMilliseconds() ;
        if(io.sockets.connected[opid] != null)io.sockets.connected[opid]
            .emit("update_game", {opscore : score});
        socket.emit("updated");
    };
    
    var endGameCallBack = function (id1 , score1 , id2 , score2) {
        if (io.sockets.connected[id1] != null) io.sockets.connected[id1].emit("end_game" , {opscore : score2});
        if (io.sockets.connected[id2] != null) io.sockets.connected[id2].emit("end_game" , {opscore : score1});
        console.log("game with id " + socket.gameId + "has ended");
        delete games[socket.gameId];
        if (io.sockets.connected[id1] != null) io.sockets.connected[id1].status = socketStatus.IDLE;
        if (io.sockets.connected[id1] != null) io.sockets.connected[id2].status = socketStatus.IDLE;
    };

    var checkForSameInPending = function (id) {
        for (var i = 0; i < pendingUsers.length; i++) {
            if (pendingUsers[i].id === id) {
                console.log("Duplicate socketId packet found");
                return true;
            }
        }
        return false;
    };

    var addToPendingList = function(id , name) {
        var pendingUser = new createPendingUser(id , name);
        console.log(pendingUser.id);
        pendingUsers.push(pendingUser);
    };

    var checkForConnecting = function() {
        var user1;
        var user2;
        if (pendingUsers.length < 2) return;
        while (pendingUsers.length > 1){
            var temp = pendingUsers.splice(0, 1)[0];
            if (io.sockets.connected[temp.id] != null){
                user1 = temp;
                break;
            }
        }
        while (pendingUsers.length > 0){
            temp = pendingUsers.splice(0, 1)[0];
            if (io.sockets.connected[temp.id] != null){
                user2=temp;
                break;
            }
        }

        if (user1 == null && user2 != null) pendingUsers.push(user2);
        else if (user1 != null && user2 == null) pendingUsers.push(user1);
        else if (user1 != null && user2 != null) {
            startGame(user1 , user2);
        }
    };

    var startGame = function(user1 , user2){
        if(io.sockets.connected[user1.id] != null)
            io.sockets.connected[user1.id].emit( "accept_game" , { opname : user2.name , timeofgame : timeOfGame });
        if(io.sockets.connected[user2.id] != null)
            io.sockets.connected[user2.id].emit( "accept_game" , { opname : user1.name , timeofgame : timeOfGame });
        if(io.sockets.connected[user2.id] != null)
            io.sockets.connected[user2.id].status = socketStatus.IN_GAME;
        if(io.sockets.connected[user1.id] != null)
            io.sockets.connected[user1.id].status = socketStatus.IN_GAME;
        setTimeout(forceEndGame , (timeOfGame+5)*1000 );
        var gameId = generateUniqueId();
        games[gameId] = new GameMaker(user1.id , user1.name , user2.id , user2.name , gameId , Date.now());
        console.log("games with id " + gameId + "has started");
        if(io.sockets.connected[user2.id] != null)
            io.sockets.connected[user2.id].gameId = gameId;
        if(io.sockets.connected[user1.id] != null)
            io.sockets.connected[user1.id].gameId = gameId;
    };

    var removeFromPendingList = function(id) {
        for (var i = 0; i < pendingUsers.length; i++) {
            if (pendingUsers[i].id === id) {
                pendingUsers.splice(i,1);
                return;
            }
        }
    };

    var forceEndGame = function () {
        if (games[socket.gameId] != null){
            games[socket.gameId].forceEndGame(endGameCallBack);
        }
    }
});

function createPendingUser(id , name) {
    this.id = id;
    this.name = name ;
}

var generateUniqueId = function () {
    return Date.now().toString();
};

