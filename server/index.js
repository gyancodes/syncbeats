const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const roomManager = require("./roomManager");
const { registerSyncHandlers } = require("./syncHandler");
const { searchVideos } = require("./youtubeService");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// YouTube search endpoint
app.get("/api/youtube/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Query parameter q is required" });
  }
  try {
    const results = await searchVideos(q);
    res.json({ results });
  } catch (error) {
    console.error("YouTube search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});
// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  let currentRoom = null;
  let userName = null;

  // Create a new room
  socket.on("room:create", (data, callback) => {
    userName = data.userName || "Anonymous";
    const room = roomManager.createRoom(socket.id, userName);

    currentRoom = room.code;
    socket.join(room.code);
    roomManager.addUserToRoom(room.code, socket.id, userName);

    console.log(`Room created: ${room.code} by ${userName}`);

    if (callback) {
      callback({
        success: true,
        roomCode: room.code,
        users: roomManager.getRoomUsers(room.code),
      });
    }
  });

  // Join an existing room
  socket.on("room:join", (data, callback) => {
    const { roomCode, userName: name } = data;
    userName = name || "Anonymous";

    const room = roomManager.getRoom(roomCode);

    if (!room) {
      if (callback) {
        callback({ success: false, error: "Room not found" });
      }
      return;
    }

    currentRoom = roomCode.toUpperCase();
    socket.join(currentRoom);
    roomManager.addUserToRoom(currentRoom, socket.id, userName);

    const users = roomManager.getRoomUsers(currentRoom);
    const playbackState = roomManager.getPlaybackState(currentRoom);

    console.log(`${userName} joined room: ${currentRoom}`);

    // Notify others in the room
    socket.to(currentRoom).emit("room:user-joined", {
      user: { id: socket.id, name: userName },
      users: users,
    });

    if (callback) {
      callback({
        success: true,
        roomCode: currentRoom,
        users: users,
        playbackState: playbackState,
      });
    }
  });

  // Leave room
  socket.on("room:leave", () => {
    if (currentRoom) {
      handleLeaveRoom();
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (currentRoom) {
      handleLeaveRoom();
    }
  });

  function handleLeaveRoom() {
    const room = roomManager.removeUserFromRoom(currentRoom, socket.id);
    socket.leave(currentRoom);

    if (room) {
      const users = roomManager.getRoomUsers(currentRoom);
      io.to(currentRoom).emit("room:user-left", {
        userId: socket.id,
        users: users,
      });
      console.log(`${userName} left room: ${currentRoom}`);
    } else {
      console.log(`Room ${currentRoom} closed (empty)`);
    }

    currentRoom = null;
  }

  // Register sync handlers
  registerSyncHandlers(io, socket);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SyncBeats server running on port ${PORT}`);
});
