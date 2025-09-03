const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const ytdl = require("@distube/ytdl-core");
const ytSearch = require("yt-search");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));
app.use(express.json());

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  },
});

// Store active rooms and their states
const rooms = new Map();
const roomLinks = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        users: new Set(),
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        volume: 1,
        playlist: [],
        createdAt: Date.now(),
        creator: socket.id,
        controller: null,
        lastActionTime: null,
        lastActionBy: null,
      });
    }

    rooms.get(roomId).users.add(socket.id);
    socket.emit("roomJoined", roomId);

    // Send room state
    const roomState = rooms.get(roomId);
    const stateToSend = {
      id: roomState.id,
      currentTrack: roomState.currentTrack,
      isPlaying: roomState.isPlaying,
      currentTime: roomState.currentTime,
      volume: roomState.volume,
      playlist: roomState.playlist,
      controller: roomState.controller,
      users: Array.from(roomState.users),
    };

    socket.emit("roomState", stateToSend);

    // Generate share link
    if (!roomLinks.has(roomId)) {
      const shareLink = `http://localhost:3000/?room=${roomId}`;
      roomLinks.set(roomId, shareLink);
    }

    // Broadcast user count update
    const userCount = rooms.get(roomId).users.size;
    io.to(roomId).emit("userCountUpdate", { userCount, roomId });

    console.log(`User ${socket.id} joined room ${roomId}. Total users: ${userCount}`);
  });

  // Leave room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);

    if (rooms.has(roomId)) {
      rooms.get(roomId).users.delete(socket.id);

      if (rooms.get(roomId).users.size === 0) {
        rooms.delete(roomId);
        roomLinks.delete(roomId);
      } else {
        const userCount = rooms.get(roomId).users.size;
        io.to(roomId).emit("userCountUpdate", { userCount, roomId });
      }
    }

    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Play music
  socket.on("play", (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);

      if (!room.controller) {
        room.controller = socket.id;
      }

      if (room.controller === socket.id) {
        room.isPlaying = true;
        room.lastActionTime = Date.now();
        room.lastActionBy = socket.id;

        socket.to(roomId).emit("play", room.currentTime);

        if (room.currentTrack) {
          socket.to(roomId).emit("trackChanged", room.currentTrack);
        }

        console.log(`User ${socket.id} started playback in room ${roomId}`);
      } else {
        socket.emit("controlDenied", {
          message: "Another user is currently controlling playback",
          controller: room.controller,
        });
      }
    }
  });

  // Pause music
  socket.on("pause", (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);

      if (room.controller === socket.id) {
        room.isPlaying = false;
        room.lastActionTime = Date.now();
        room.lastActionBy = socket.id;

        socket.to(roomId).emit("pause");
        console.log(`User ${socket.id} paused playback in room ${roomId}`);
      } else {
        socket.emit("controlDenied", {
          message: "Another user is currently controlling playback",
          controller: room.controller,
        });
      }
    }
  });

  // Request control
  socket.on("requestControl", (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const now = Date.now();
      const controllerTimeout = 30000;

      if (!room.controller || 
          !room.users.has(room.controller) || 
          (room.lastActionTime && (now - room.lastActionTime) > controllerTimeout)) {
        
        room.controller = socket.id;
        room.lastActionTime = now;

        io.to(roomId).emit("controllerChanged", { 
          controller: socket.id,
          isYou: false 
        });
        
        socket.emit("controllerChanged", { 
          controller: socket.id,
          isYou: true 
        });

        console.log(`Control granted to user ${socket.id} in room ${roomId}`);
      } else {
        socket.emit("controlDenied", { 
          message: "Another user is currently controlling playback",
          controller: room.controller 
        });
      }
    }
  });

  // Other socket events (seek, volume, tracks, etc.)
  socket.on("seek", (data) => {
    const { roomId, time } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).currentTime = time;
      socket.to(roomId).emit("seek", time);
    }
  });

  socket.on("volumeChange", (data) => {
    const { roomId, volume } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).volume = volume;
      socket.to(roomId).emit("volumeChange", volume);
    }
  });

  socket.on("addTrack", (data) => {
    const { roomId, track } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).playlist.push(track);
      if (!rooms.get(roomId).currentTrack) {
        rooms.get(roomId).currentTrack = track;
      }
      socket.to(roomId).emit("playlistUpdate", rooms.get(roomId).playlist);
      socket.to(roomId).emit("trackAdded", track);
    }
  });

  socket.on("changeTrack", (data) => {
    const { roomId, trackIndex } = data;
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.playlist[trackIndex]) {
        room.currentTrack = room.playlist[trackIndex];
        room.currentTime = 0;
        room.isPlaying = false;
        socket.to(roomId).emit("trackChanged", room.currentTrack);
        socket.to(roomId).emit("pause");
      }
    }
  });

  socket.on("trackRemoved", (data) => {
    const { roomId, trackId } = data;
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.playlist = room.playlist.filter((track) => track.id !== trackId);

      if (room.currentTrack && room.currentTrack.id === trackId) {
        room.currentTrack = room.playlist.length > 0 ? room.playlist[0] : null;
      }

      socket.to(roomId).emit("trackRemoved", { trackId });
      socket.to(roomId).emit("playlistUpdate", room.playlist);
    }
  });

  // YouTube search
  socket.on("searchYouTube", async (data) => {
    try {
      const { query, roomId } = data;
      const results = await ytSearch(query);
      socket.emit("youtubeResults", {
        results: results.videos.slice(0, 10),
        roomId,
      });
    } catch (error) {
      console.error("YouTube search error:", error);
      socket.emit("youtubeError", {
        error: "Search failed",
        roomId: data.roomId,
      });
    }
  });

  // Add YouTube track
  socket.on("addYouTubeTrack", async (data) => {
    try {
      const { videoId, roomId } = data;
      const videoInfo = await ytdl.getInfo(videoId);

      const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
      const bestAudio = audioFormats.find((format) => format.container === "mp4") || audioFormats[0];

      if (!bestAudio) {
        throw new Error("No audio format available");
      }

      const track = {
        id: `yt_${videoId}`,
        name: videoInfo.videoDetails.title,
        url: bestAudio.url,
        type: "youtube",
        duration: parseInt(videoInfo.videoDetails.lengthSeconds),
        thumbnail: videoInfo.videoDetails.thumbnails[0]?.url,
        size: "YouTube Video",
      };

      if (rooms.has(roomId)) {
        rooms.get(roomId).playlist.push(track);
        if (!rooms.get(roomId).currentTrack) {
          rooms.get(roomId).currentTrack = track;
        }
        socket.to(roomId).emit("playlistUpdate", rooms.get(roomId).playlist);
        socket.to(roomId).emit("trackAdded", track);
        socket.emit("youtubeTrackAdded", { track, roomId });
      }
    } catch (error) {
      console.error("YouTube track add error:", error);
      socket.emit("youtubeError", {
        error: "Failed to add YouTube track",
        roomId: data.roomId,
      });
    }
  });

  // Get share link
  socket.on("getShareLink", (roomId) => {
    if (rooms.has(roomId)) {
      const shareLink = roomLinks.get(roomId) || `http://localhost:3000/?room=${roomId}`;
      socket.emit("shareLink", { roomId, shareLink });
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);

        if (room.controller === socket.id) {
          room.controller = null;
          room.lastActionTime = null;

          io.to(roomId).emit("controllerChanged", {
            controller: null,
            isYou: false,
          });
        }

        if (room.users.size === 0) {
          rooms.delete(roomId);
          roomLinks.delete(roomId);
        } else {
          const userCount = room.users.size;
          io.to(roomId).emit("userCountUpdate", { userCount, roomId });
        }
      }
    }
  });
});

// API Routes
app.post("/upload", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    console.error(`File not found: ${filePath}`);
    res.status(404).json({ error: "File not found" });
  }
});

// Create uploads directory
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SyncBeats server running on port ${PORT}`);
  console.log(`Socket.IO server ready for Next.js frontend`);
});