// File Upload and Management Service
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

class FileUploadService {
  constructor() {
    this.setupStorage();
    this.ensureUploadDirectory();
  }

  setupStorage() {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/");
      },
      filename: function (req, file, cb) {
        cb(null, uuidv4() + path.extname(file.originalname));
      },
    });

    this.upload = multer({
      storage: storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("audio/")) {
          cb(null, true);
        } else {
          cb(new Error("Only audio files are allowed!"), false);
        }
      },
    });
  }

  ensureUploadDirectory() {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
  }

  getUploadMiddleware() {
    return this.upload.single("audio");
  }

  handleUpload(req, res) {
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
  }

  handleFileRequest(req, res) {
    const filePath = path.join(__dirname, "../../../uploads", req.params.filename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).json({ error: "File not found" });
    }
  }
}

module.exports = { FileUploadService };