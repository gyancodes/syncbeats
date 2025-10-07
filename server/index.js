// SyncBeats Server - Main Entry Point
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const { SocketHandler } = require("./services/SocketHandler");
const { FileUploadService } = require("./services/FileUploadService");
const { YouTubeService } = require("./services/YouTubeService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize services
const fileUploadService = new FileUploadService();
const youtubeService = new YouTubeService();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

// Set Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' ws: wss: http: https:; " +
    "media-src 'self' blob: data: https:; " +
    "font-src 'self' data:;"
  );
  next();
});

// Initialize socket handler
const socketHandler = new SocketHandler(io);
socketHandler.initialize();

// API Routes
app.post("/upload", fileUploadService.getUploadMiddleware(), (req, res) => {
  fileUploadService.handleUpload(req, res);
});

app.get("/uploads/:filename", (req, res) => {
  fileUploadService.handleFileRequest(req, res);
});

// YouTube API endpoint
app.get("/api/youtube/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const result = await youtubeService.getStreamUrl(videoId);
    res.json({
      success: true,
      url: result.url,
      title: result.title,
    });
  } catch (error) {
    console.error("YouTube API error:", error);
    res.status(500).json({ error: "Failed to get YouTube audio URL" });
  }
});

// Serve static files from build directory
app.use(express.static(path.join(__dirname, "../dist")));

// Serve React app for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SyncBeats server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
