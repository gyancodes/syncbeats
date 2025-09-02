const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const ytdl = require("@distube/ytdl-core");
const ytSearch = require("yt-search");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

// Store room share links
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
        controller: null, // Who currently controls play/pause
        lastActionTime: null, // When last control action happened
        lastActionBy: null, // Who performed the last action
      });
    }

    rooms.get(roomId).users.add(socket.id);
    socket.emit("roomJoined", roomId);

    // Send room state with controller info
    const roomState = rooms.get(roomId);
    const stateToSend = {
      id: roomState.id,
      currentTrack: roomState.currentTrack,
      isPlaying: roomState.isPlaying,
      currentTime: roomState.currentTime,
      volume: roomState.volume,
      playlist: roomState.playlist,
      controller: roomState.controller,
      users: Array.from(roomState.users), // Convert Set to Array for JSON
    };

    socket.emit("roomState", stateToSend);
    console.log(`Sent room state to ${socket.id}:`, {
      currentTrack: roomState.currentTrack?.name || "none",
      isPlaying: roomState.isPlaying,
      playlistLength: roomState.playlist.length,
    });

    // Generate share link if not exists
    if (!roomLinks.has(roomId)) {
      const shareLink = `http://localhost:3001/join/${roomId}`;
      roomLinks.set(roomId, shareLink);
    }

    // Broadcast user count update to all users in room
    const userCount = rooms.get(roomId).users.size;
    io.to(roomId).emit("userCountUpdate", { userCount, roomId });

    console.log(
      `User ${socket.id} joined room ${roomId}. Total users: ${userCount}`
    );
  });

  // Leave room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);

    if (rooms.has(roomId)) {
      rooms.get(roomId).users.delete(socket.id);

      if (rooms.get(roomId).users.size === 0) {
        rooms.delete(roomId);
      } else {
        // Broadcast updated user count to remaining users
        const userCount = rooms.get(roomId).users.size;
        io.to(roomId).emit("userCountUpdate", { userCount, roomId });
      }
    }

    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Play music - only allow if user is the current controller or no controller exists
  socket.on("play", (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);

      // Set this user as the controller if none exists
      if (!room.controller) {
        room.controller = socket.id;
      }

      // Only allow the current controller to play/pause
      if (room.controller === socket.id) {
        room.isPlaying = true;
        room.lastActionTime = Date.now();
        room.lastActionBy = socket.id;

        // Broadcast to all other users in the room with current track info
        socket.to(roomId).emit("play", room.currentTime);

        // Also send current track to ensure everyone has the same track
        if (room.currentTrack) {
          socket.to(roomId).emit("trackChanged", room.currentTrack);
        }

        console.log(
          `User ${socket.id} started playback in room ${roomId} at time ${room.currentTime}`
        );
      } else {
        // Notify user they don't have control
        socket.emit("controlDenied", {
          message: "Another user is currently controlling playback",
          controller: room.controller,
        });
      }
    }
  });

  // Pause music - only allow if user is the current controller
  socket.on("pause", (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);

      // Only allow the current controller to play/pause
      if (room.controller === socket.id) {
        room.isPlaying = false;
        room.lastActionTime = Date.now();
        room.lastActionBy = socket.id;

        // Broadcast to all other users in the room
        socket.to(roomId).emit("pause");
        console.log(`User ${socket.id} paused playback in room ${roomId}`);
      } else {
        // Notify user they don't have control
        socket.emit("controlDenied", {
          message: "Another user is currently controlling playback",
          controller: room.controller,
        });
      }
    }
  });

  // Request control of playback
  socket.on("requestControl", (roomId) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);

      // Check if current controller is still active (within last 30 seconds)
      const now = Date.now();
      const controllerTimeout = 30000; // 30 seconds

      if (
        !room.controller ||
        !room.users.has(room.controller) ||
        (room.lastActionTime && now - room.lastActionTime > controllerTimeout)
      ) {
        // Grant control to requesting user
        room.controller = socket.id;
        room.lastActionTime = now;

        // Notify all users about the new controller
        io.to(roomId).emit("controllerChanged", {
          controller: socket.id,
          isYou: false,
        });

        socket.emit("controllerChanged", {
          controller: socket.id,
          isYou: true,
        });

        console.log(`Control granted to user ${socket.id} in room ${roomId}`);
      } else {
        socket.emit("controlDenied", {
          message: "Another user is currently controlling playback",
          controller: room.controller,
        });
      }
    }
  });

  // Seek to specific time
  socket.on("seek", (data) => {
    const { roomId, time } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).currentTime = time;
      socket.to(roomId).emit("seek", time);
    }
  });

  // Update volume
  socket.on("volumeChange", (data) => {
    const { roomId, volume } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).volume = volume;
      socket.to(roomId).emit("volumeChange", volume);
    }
  });

  // Add track to playlist
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

  // Change track
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

  // Sync time (for keeping everyone in sync)
  socket.on("syncTime", (data) => {
    const { roomId, time } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).currentTime = time;
      socket.to(roomId).emit("syncTime", time);
    }
  });

  // Remove track from playlist
  socket.on("trackRemoved", (data) => {
    const { roomId, trackId } = data;
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.playlist = room.playlist.filter((track) => track.id !== trackId);

      // If current track was removed, clear it
      if (room.currentTrack && room.currentTrack.id === trackId) {
        room.currentTrack = room.playlist.length > 0 ? room.playlist[0] : null;
      }

      socket.to(roomId).emit("trackRemoved", { trackId });
      socket.to(roomId).emit("playlistUpdate", room.playlist);
    }
  });

  // Get room share link
  socket.on("getShareLink", (roomId) => {
    if (rooms.has(roomId)) {
      const shareLink =
        roomLinks.get(roomId) || `http://localhost:3000/join/${roomId}`;
      socket.emit("shareLink", { roomId, shareLink });
    }
  });

  // Search YouTube
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

      // Get the best audio format
      const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
      const bestAudio =
        audioFormats.find((format) => format.container === "mp4") ||
        audioFormats[0];

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

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms and update user counts
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);

        // If the disconnecting user was the controller, clear controller
        if (room.controller === socket.id) {
          room.controller = null;
          room.lastActionTime = null;

          // Notify remaining users that control is available
          io.to(roomId).emit("controllerChanged", {
            controller: null,
            isYou: false,
          });
        }

        if (room.users.size === 0) {
          rooms.delete(roomId);
        } else {
          // Broadcast updated user count to remaining users
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

    const fileUrl = `/uploads/${req.file.filename}`;
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
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  // Check if file exists before sending
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error(`File not found: ${filePath}`);
    res.status(404).json({ error: "File not found" });
  }
});

// Direct room join route
app.get("/join/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  res.redirect(`/?room=${roomId}`);
});

// Get room info
app.get("/api/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    res.json({
      exists: true,
      roomId: room.id,
      userCount: room.users.size,
      currentTrack: room.currentTrack,
      isPlaying: room.isPlaying,
    });
  } else {
    res.json({ exists: false });
  }
});

// Get all active rooms
app.get("/api/rooms", (req, res) => {
  const activeRooms = Array.from(rooms.entries()).map(([id, room]) => ({
    id: room.id,
    userCount: room.users.size,
    currentTrack: room.currentTrack,
    isPlaying: room.isPlaying,
    createdAt: room.createdAt,
  }));
  res.json(activeRooms);
});

// Get YouTube stream URL
app.get("/api/youtube/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoInfo = await ytdl.getInfo(videoId);

    // Get the best audio format
    const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
    const bestAudio =
      audioFormats.find((format) => format.container === "mp4") ||
      audioFormats[0];

    if (!bestAudio) {
      return res.status(404).json({ error: "No audio format available" });
    }

    res.json({
      url: bestAudio.url,
      title: videoInfo.videoDetails.title,
      duration: parseInt(videoInfo.videoDetails.lengthSeconds),
    });
  } catch (error) {
    console.error("YouTube stream error:", error);
    res.status(500).json({ error: "Failed to get YouTube stream" });
  }
});

// Create uploads directory if it doesn't exist
const fs = require("fs");
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`SyncBeats server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
