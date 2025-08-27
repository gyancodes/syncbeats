const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Store active rooms and their states
const rooms = new Map();

// Store room share links
const roomLinks = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('joinRoom', (roomId) => {
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
        creator: socket.id
      });
    }
    
    rooms.get(roomId).users.add(socket.id);
    socket.emit('roomJoined', roomId);
    socket.emit('roomState', rooms.get(roomId));
    
    // Generate share link if not exists
    if (!roomLinks.has(roomId)) {
      const shareLink = `http://localhost:3000/join/${roomId}`;
      roomLinks.set(roomId, shareLink);
    }
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Leave room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    
    if (rooms.has(roomId)) {
      rooms.get(roomId).users.delete(socket.id);
      
      if (rooms.get(roomId).users.size === 0) {
        rooms.delete(roomId);
      }
    }
    
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Play music
  socket.on('play', (roomId) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).isPlaying = true;
      rooms.get(roomId).currentTime = 0;
      socket.to(roomId).emit('play', rooms.get(roomId).currentTime);
    }
  });

  // Pause music
  socket.on('pause', (roomId) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).isPlaying = false;
      socket.to(roomId).emit('pause');
    }
  });

  // Seek to specific time
  socket.on('seek', (data) => {
    const { roomId, time } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).currentTime = time;
      socket.to(roomId).emit('seek', time);
    }
  });

  // Update volume
  socket.on('volumeChange', (data) => {
    const { roomId, volume } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).volume = volume;
      socket.to(roomId).emit('volumeChange', volume);
    }
  });

  // Add track to playlist
  socket.on('addTrack', (data) => {
    const { roomId, track } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).playlist.push(track);
      if (!rooms.get(roomId).currentTrack) {
        rooms.get(roomId).currentTrack = track;
      }
      socket.to(roomId).emit('playlistUpdate', rooms.get(roomId).playlist);
      socket.to(roomId).emit('trackAdded', track);
    }
  });

  // Change track
  socket.on('changeTrack', (data) => {
    const { roomId, trackIndex } = data;
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.playlist[trackIndex]) {
        room.currentTrack = room.playlist[trackIndex];
        room.currentTime = 0;
        room.isPlaying = false;
        socket.to(roomId).emit('trackChanged', room.currentTrack);
        socket.to(roomId).emit('pause');
      }
    }
  });

  // Sync time (for keeping everyone in sync)
  socket.on('syncTime', (data) => {
    const { roomId, time } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).currentTime = time;
      socket.to(roomId).emit('syncTime', time);
    }
  });

  // Get room share link
  socket.on('getShareLink', (roomId) => {
    if (rooms.has(roomId)) {
      const shareLink = roomLinks.get(roomId) || `http://localhost:3000/join/${roomId}`;
      socket.emit('shareLink', { roomId, shareLink });
    }
  });

  // Search YouTube
  socket.on('searchYouTube', async (data) => {
    try {
      const { query, roomId } = data;
      const results = await ytSearch(query);
      socket.emit('youtubeResults', { results: results.videos.slice(0, 10), roomId });
    } catch (error) {
      console.error('YouTube search error:', error);
      socket.emit('youtubeError', { error: 'Search failed', roomId: data.roomId });
    }
  });

  // Add YouTube track
  socket.on('addYouTubeTrack', async (data) => {
    try {
      const { videoId, roomId } = data;
      const videoInfo = await ytdl.getInfo(videoId);
      const track = {
        id: `yt_${videoId}`,
        name: videoInfo.videoDetails.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        type: 'youtube',
        duration: parseInt(videoInfo.videoDetails.lengthSeconds),
        thumbnail: videoInfo.videoDetails.thumbnails[0]?.url,
        size: 'YouTube Video'
      };

      if (rooms.has(roomId)) {
        rooms.get(roomId).playlist.push(track);
        if (!rooms.get(roomId).currentTrack) {
          rooms.get(roomId).currentTrack = track;
        }
        socket.to(roomId).emit('playlistUpdate', rooms.get(roomId).playlist);
        socket.to(roomId).emit('trackAdded', track);
        socket.emit('youtubeTrackAdded', { track, roomId });
      }
    } catch (error) {
      console.error('YouTube track add error:', error);
      socket.emit('youtubeError', { error: 'Failed to add YouTube track', roomId: data.roomId });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

// API Routes
app.post('/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      fileUrl: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/uploads/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', req.params.filename));
});

// Direct room join route
app.get('/join/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  res.redirect(`/?room=${roomId}`);
});

// Get room info
app.get('/api/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    res.json({
      exists: true,
      roomId: room.id,
      userCount: room.users.size,
      currentTrack: room.currentTrack,
      isPlaying: room.isPlaying
    });
  } else {
    res.json({ exists: false });
  }
});

// Get all active rooms
app.get('/api/rooms', (req, res) => {
  const activeRooms = Array.from(rooms.entries()).map(([id, room]) => ({
    id: room.id,
    userCount: room.users.size,
    currentTrack: room.currentTrack,
    isPlaying: room.isPlaying,
    createdAt: room.createdAt
  }));
  res.json(activeRooms);
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SyncBeats server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
