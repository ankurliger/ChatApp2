const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Ankur2", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
  });

// Create a schema for your messages
const messageSchema = new mongoose.Schema({
  room: String,
  author: String, // New field for author name
  message: String,
});

// Create a model based on the schema
const Message = mongoose.model("Message", messageSchema);

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    // Save the message to MongoDB
    const message = new Message({
      room: data.room,
      author: data.author, // Assign the author name from the data
      message: data.message,
    });
    message.save()
      .then((savedMessage) => {
        console.log("Message saved to MongoDB");
        const messageData = {
          room: savedMessage.room,
          author: savedMessage.author,
          message: savedMessage.message,
          _id: savedMessage._id, // Include the ID in the response
        };
        // Broadcast the message data to all clients in the room
        socket.to(data.room).emit("receive_message", messageData);
      })
      .catch((error) => {
        console.error("Failed to save message to MongoDB", error);
      });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});

