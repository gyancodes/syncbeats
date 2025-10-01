// API Routes Configuration
const { YouTubeService } = require("../services/YouTubeService");
const { RoomManager } = require("../services/RoomManager");

function setupRoutes(app, fileUploadService) {
  const youtubeService = new YouTubeService();
  const roomManager = new RoomManager();

  // File upload routes
  app.post("/upload", fileUploadService.getUploadMiddleware(), (req, res) => {
    fileUploadService.handleUpload(req, res);
  });

  app.get("/uploads/:filename", (req, res) => {
    fileUploadService.handleFileRequest(req, res);
  });

  // Room routes
  app.get("/join/:roomId", (req, res) => {
    const roomId = req.params.roomId;
    res.redirect(`/?room=${roomId}`);
  });

  app.get("/api/room/:roomId", (req, res) => {
    const roomId = req.params.roomId;
    const roomInfo = roomManager.getRoomInfo(roomId);
    res.json(roomInfo);
  });

  app.get("/api/rooms", (req, res) => {
    const activeRooms = roomManager.getAllRooms();
    res.json(activeRooms);
  });

  // YouTube routes
  app.get("/api/youtube/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      const streamData = await youtubeService.getStreamUrl(videoId);
      res.json(streamData);
    } catch (error) {
      console.error("YouTube stream error:", error);
      res.status(500).json({ error: "Failed to get YouTube stream" });
    }
  });
}

module.exports = { setupRoutes };