

var game =  function (user1Id, user1name, user2Id, user2name, gameId , startTime) {

    this.gameId = gameId;
    this.id1 = user1Id;
    this.id2 = user2Id;
    this.score1 = 0;
    this.score2 = 0;
    this.name1 = user1name;
    this.name2 = user2name;
    this.isEnded1 = false;
    this.isEnded2 = false;
    this.startTime = startTime;

    this.getName = function(id){
        if (id == this.id1) return this.name1;
        else if (id == this.id2) return this.name2;
        else console.log("unknown id 1");
    };

    this.updateScore = function(id , score , clientTime , callBack){
        if (id == this.id1){
            this.score1 = score;
            // callBack(this.id2 , this.score1 , Math.floor((Date.now() - this.startTime)/1000))
            callBack(this.id2 , this.score1 , clientTime);
        }
        else if (id == this.id2){
            this.score2 = score;
            // callBack(this.id1 , this.score2 , Math.floor((Date.now() - this.startTime)/1000))
            callBack(this.id1 , this.score2 , clientTime);
        }
        else {
            console.log("unknown id 2");
        }
    };

    this.endGame = function(id , score , callBack){
        if (id == this.id1){
            this.score1 = score;
            this.isEnded1 = true;
        }
        else if (id == this.id2){
            this.score2 = score;
            this.isEnded2 = true;
        }
        else {
            console.log("unknown id 3");
        }
        if (this.isEnded1 == true && this.isEnded2 == true){
            callBack(this.id1 , this.score1 , this.id2 , this.score2);
        }
    };

    this.forceEndGame = function(callBack){
        callBack(this.id1 , this.score1 , this.id2 , this.score2);
    };

};

module.exports = game;