function GameManager(size) {
  this.size           = size; // Size of the grid
  this.inputManager   = new KeyboardInputManager;
  // this.actuator       = new Actuator;  // do I need this?

  this.actuator = new HTMLActuator;

  //creates a Grid
  this.grid = new Grid(this.size);

  // create metaData
  this.metaData = {
    c_score : 0,
    game_over : false,
    won : false
  };

  // bind the move and button functions to the inputManager
  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));  // restart button
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this)); // keepPlaying button
  this.inputManager.on("save", this.save.bind(this)); // Save button


  // initialize a new board with "gameID"
  console.log("start a new game" + this.grid.cells)
  // this.setup();
  console.log(this.grid.cells)

  this.getInitScoreboard();
  //update the scoreboard
  setInterval(this.getScoreboard, 3000)

  //update time
  setInterval(this.updateTime, 1000)

  //team score update
  setInterval(this.getTeamScore, 5000)
}

GameManager.prototype.updateTime = function() {
    var timeDiv = document.getElementById('time');
    var now = new Date();
    timeDiv.innerHTML = `Server time: ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}


// Initialize a new game and ask for a new "gameId"
GameManager.prototype.setup = function(){
  var self = this;


  // get the gameId and the initial map
  var request = new XMLHttpRequest();
  request.open("GET", "/api/new_game");
  request.responseType = 'json';
  request.onload = () => {
    // gameId and highScore
    this.gameId = request.response['uId'];
    this.metaData.c_score = request.response['c_score'];
    console.log("start game:")
    console.log(this.metaData)

    // game canno be end at the first run
    // this.metaData.game_over = request.response['game_over'];

    // initialize the map
    updatedCells = request.response['board'];
    // fill the grid with new values
    for(var i = 0; i < updatedCells.length; i++) {
      for(var j = 0; j < updatedCells.length; j++) {
        var tile = updatedCells[i][j]

        // either create a new tile or set to null
        var position = ({ x : j, y : i});
        // update the grid position
        this.grid.cells[i][j] = (tile ? new Tile(position, tile) : null);
      }
    }
    // "print" the tiles to the grid
    this.actuator.actuate(this.grid, this.metaData)
    }
  request.send();
};


// Restart the game and asks for a new board and gameID
GameManager.prototype.restart = function(){
  this.metaData.game_over = false;
  this.metaData.won = false;

  this.actuator.continueGame(); // Clear the game won/lost message
  console.log("restart function")
  this.setup();
};


// get the fresh updated board from the backend
GameManager.prototype.move = function (direction) {
  // to "chanel" a global vairable into embedded function of XMLHttpRequest
  var self = this;

  // convert directon from '0123' to "wasd" format
  var moveType = "w";

  if (direction == 0){
    moveType = "w"
  }
  else if (direction == 1) {
    moveType = "d"
  }
  else if (direction == 2) {
    moveType = "s"
  }
  else if (direction == 3) {
    moveType = "a"
  }

  // console.log(direction)
  console.log(moveType)

  // Save current move with gameId
  var currentMove = JSON.stringify({"uId" : this.gameId, "direction" : moveType });

  // create object for request OR USE FETCH API https://scotch.io/tutorials/how-to-use-the-javascript-fetch-api-to-get-data
  var request = new XMLHttpRequest();

  // SEND "currentMove" to the server
  request.open("POST", "/api/play_the_game");
  request.setRequestHeader("Content-Type", "application/json");

  // RECIEVE the updated board due to "currentMove" fom the server
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {

      var json = JSON.parse(request.responseText);
      // get the new cells in 2D array
      var updatedCells = json['board'];
      // console.log(self.metaData);
      self.metaData.c_score = request.response;

      self.metaData.c_score = json["c_score"];
      self.metaData.game_over = json["game_over"];

      // // DEBUG
      // console.log("recieved 2D array is:  ");
      // console.log(updatedCells);

      // fill the grid with new values
      for(var i = 0; i < updatedCells.length; i++) {
        for(var j = 0; j < updatedCells.length; j++) {
          // get the fresh value for
          var tile = updatedCells[i][j]

          // check if the game is won, HOW TO CHECK?
          if (tile == 2048){
            self.metaData.won = True;
          };

          // either create a new tile or set to null
          var position = ({ x : j, y : i});
          // update the tile position
          self.grid.cells[i][j] = (tile ? new Tile(position, tile) : null);
        }
      }
      // console.log("recieved 2D array converted to the grid:")
      // console.log(this.grid.cells)
      self.actuator.actuate(self.grid, self.metaData);
    }
  };
  // console.log(this.grid);
  //
  // console.log(currentMove)
  request.send(currentMove);
};


// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.actuator.continueGame(); // Clear the game won/lost message
  this.metaData.won = False;
};


// Save username and current score
GameManager.prototype.save = function () {
  // ask for usernam
  var name = prompt("Please enter your nickname!")

  // Save current move with gameId
  var userData = JSON.stringify({"c_score" : this.metaData.c_score, "u_name" : name });

  // create object for request OR USE FETCH API https://scotch.io/tutorials/how-to-use-the-javascript-fetch-api-to-get-data
  var request = new XMLHttpRequest();

  // SEND "currentMove" to the server
  request.open("POST", "/save_user_highscore");
  request.setRequestHeader("Content-Type", "application/json");

  request.send(userData);

  this.restart(); // Clear the game won/lost message
};


// gets the scoreboard and print it
GameManager.prototype.getScoreboard = function(){
  var self = this;

  this.scoreboardContainer = document.getElementById("current-score");
  // get the high scores list
  var request = new XMLHttpRequest();
  request.open("GET", "/api/high_scores/current");
  request.responseType = 'json';
  request.onload = () => {
    // gameId and highScore
    this.scoreboard = request.response;

    this.scoreboardContainer.innerHTML = '';
    // print the first 10 highscore
    for (var i = 0;  i < this.scoreboard.length; i++){
      var team = this.scoreboard[i];
      var title = document.createElement("p");
      title.innerHTML = `${team.name} (${team.running})`;
      this.scoreboardContainer.appendChild(title);

      var list = document.createElement("ol");

      for (var j = 0; j < team.scores.length; j++) {
        // create html properties and add them to index
        var p = document.createElement("li")
        var dead = team.scores[j][2] ? " ✝": "";
        var stepCount = team.scores[j][3] !== null ? ` [${team.scores[j][3]}]` : "";
        p.innerHTML += (team.scores[j][0] + " : "+ team.scores[j][1] + stepCount + dead);
        list.appendChild(p);
      }

      this.scoreboardContainer.appendChild(list);
    };

    console.log("high score:")
    console.log(this.scoreboard)
    }
  request.send();
};

GameManager.prototype.getInitScoreboard = function(){
  var self = this;

  this.oldScoreboardContainer = document.getElementById("old-scoreboard-container");
  // get the high scores list
  var request = new XMLHttpRequest();
  request.open("GET", "/api/high_scores");
  request.responseType = 'json';
  request.onload = () => {
    // gameId and highScore
    this.scoreboard = request.response;

      this.oldScoreboardContainer.innerHTML = '';

      for (var k = 0; k < this.scoreboard.length; k++) {
        var div = document.createElement('div');
        div.classList.add('scoreboard-container');
        div.innerHTML = `<span>${this.scoreboard[k].name}</span>`;
        // print the first 10 highscore
        for (var i = 0;  i < 10; i++){
            var row = this.scoreboard[k].scores[i];
            if (row != null){
                // create html properties and add them to index
                var p = document.createElement("p")
                p.innerHTML += (i + 1 +". " + row[0] + " : "+ row[1] + " (T: " + row[2] + ", S: " + (row[3] || "N/A") + ")");
                div.appendChild(p);
            }
        };
        this.oldScoreboardContainer.appendChild(div);
    }
    }
  request.send();
};

GameManager.prototype.getTeamScore = function(){
  var self = this;

  this.teamContainer = document.getElementById("team-container");
  console.log(this.teamContainer)
  // get the high scores list
  var request = new XMLHttpRequest();
  request.open("GET", "/api/high_scores/team");
  request.responseType = 'json';
  request.onload = () => {
    this.lastTeamScore = this.teamScore;
    // gameId and highScore
    this.teamScore = request.response;

    this.teamContainer.innerHTML = '';
    // print the first 10 highscore
    for (var i = 0;  i < this.teamScore.length; i++){
        // create html properties and add them to index
        var p = document.createElement("p")
        var delta = this.lastTeamScore ? this.teamScore[i].score - this.lastTeamScore[i].score : "0";
        p.innerHTML += (this.teamScore[i].name + " : "+ this.teamScore[i].score + " (delta: " + delta + ")" );
        this.teamContainer.appendChild(p);
    };
    }
  request.send();
};
