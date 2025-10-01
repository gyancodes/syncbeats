// Main Server Application
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

const { setupRoutes } = require("./routes");
const { SocketHandler } = require("./services/SocketHandler");
const { FileUploadService } = require("./services/FileUploadService");

class SyncBeatsServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.fileUploadService = new FileUploadService();
    this.socketHandler = new SocketHandler(this.io);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandling();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "../../public")));
  }

  setupRoutes() {
    setupRoutes(this.app, this.fileUploadService);
  }

  setupSocketHandling() {
    this.socketHandler.initialize();
  }

  start(port = 3002) {
    this.server.listen(port, () => {
      console.log(`SyncBeats server running on port ${port}`);
      console.log(`Open http://localhost:${port} in your browser`);
    });
  }
}

module.exports = { SyncBeatsServer };