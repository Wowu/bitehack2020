var express = require("express");
var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

var crypto = require("crypto");
const bodyParser = require("body-parser");

var rooms = [];

// POST args config
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());

app.use(express.static("public"));

function getId(length) {
  return crypto.randomBytes(length).toString("hex");
}

app.post("/create-room", function(req, res) {
  var roomTopic = req.body.topic;

  var objectToReturn = {};

  res.setHeader("Content-Type", "application/json");

  objectToReturn.topic = roomTopic;

  var newRoomId = getId(5);
  objectToReturn.id = newRoomId;
  objectToReturn.users = [];
  objectToReturn.ideas = [];
  objectToReturn.mode = "insert";

  rooms.push(objectToReturn);
  console.log(`Room created ${JSON.stringify(objectToReturn, null, 4)}`);
  res.end(JSON.stringify(objectToReturn));
});

io.on("connection", function(socket) {
  console.log(`New user connected (${socket.id})`);

  socket.on("connectToRoom", function({ roomId, username }) {
    console.log(`User connected to room ${roomId} as ${username}`);

    var user = {
      username: username,
      socketId: socket.id
    };

    for (let room of rooms) {
      if (room.id == roomId) {
        room.users.push(user);
        for (let userInRoom of room.users) {
          io.to(userInRoom.socketId).emit("newUserConnected", user);
        }
        socket.emit("roomInfo", room);
        return;
      }
    }
    socket.emit("roomNotFound", {});
  });

  socket.on("changeTopic", function({ roomId, topic }) {
    console.log(`Changing topic of ${roomId} to ${topic}`);

    for (var room of rooms) {
      if (room.id === roomId) {
        room.topic = topic;
        for (var userInRoom of room.users) {
          io.to(userInRoom.socketId).emit("topicChanged", topic);
        }
        return;
      }
    }
  });
  socket.on("changeRoomMode", function({ roomId, newMode }) {
    console.log(`Changing room (${roomId}) mode to ${newMode}`);

    for (var room of rooms) {
      if (room.id == roomId) {
        room.mode = newMode;

        for (var userInRoom of room.users) {
          io.to(userInRoom.socketId).emit("roomModeChanged", newMode);
        }
        return;
      }
    }
  });
  socket.on("newIdea", function({ roomId, idea }) {
    console.log(`New idea in room ${roomId} - ${idea}`);
    for (var room of rooms) {
      if (room.id == roomId) {
        idea = {
          id: getId(20),
          idea,
          score: 0
        };
        room.ideas.push(idea);

        for (var userInRoom of room.users) {
          io.to(userInRoom.socketId).emit("pushNewIdeaToUsers", idea);
        }
        return;
      }
    }
  });
  socket.on("removeIdea", function({ roomId, ideaId }) {
    console.log(`Remove idea in room ${roomId} - ${ideaId}`);
    for (var room of rooms) {
      if (room.id == roomId) {
        for (var i = 0; i < room.ideas.length; i++) {
          if (room.ideas[i].id == ideaId) {
            var removedIdea = room.ideas.splice(i, 1)[0];
            for (var userInRoom of room.users) {
              io.to(userInRoom.socketId).emit(
                "pushDeletedIdeaToUsers",
                removedIdea
              );
            }
            return;
          }
        }
      }
    }
  });
  socket.on("upvoteIdea", function({ roomId, ideaId }) {
    for (var room of rooms) {
      if (room.id == roomId) {
        for (var idea of room.ideas) {
          if (idea.id == ideaId) {
            idea.score++;

            for (var userInRoom of room.users) {
              io.to(userInRoom.socketId).emit("ideaUpvoted", idea);
            }

            return;
          }
        }
      }
    }
  });

  socket.on("downvoteIdea", function({ roomId, ideaId }) {
    for (var room of rooms) {
      if (room.id == roomId) {
        for (var idea of room.ideas) {
          if (idea.id == ideaId) {
            idea.score--;

            for (var userInRoom of room.users) {
              io.to(userInRoom.socketId).emit("ideaDownvoted", idea);
            }

            return;
          }
        }
      }
    }
  });

  socket.on("disconnect", function() {
    console.log(`User disconnected (${socket.id})`);
    for (var i = 0; i < rooms.length; i++) {
      for (var j = 0; j < rooms[i].users.length; j++) {
        if (rooms[i].users[j].socketId == socket.id) {
          var deletedUser = rooms[i].users.splice(j, 1)[0];

          for (var userInRoom in rooms[i].users) {
            io.to(userInRoom.socketId).emit("deleteUser", deletedUser);
          }
        }
      }
    }
  });
});

app.get("*", function(req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

http.listen(5000, function() {
  console.log("Listening on *:5000");
});
