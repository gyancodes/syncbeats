// Socket.IO Event Handling
const { RoomManager } = require("./RoomManager");
const { YouTubeService } = require("./YouTubeService");

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.youtubeService = new YouTubeService();
  }

  initialize() {
    this.io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Room events
      socket.on("joinRoom", (roomId) => {
        this.handleJoinRoom(socket, roomId);
      });

      socket.on("leaveRoom", (roomId) => {
        this.handleLeaveRoom(socket, roomId);
      });

      // Playback control events
      socket.on("play", (roomId) => {
        this.handlePlay(socket, roomId);
      });

      socket.on("pause", (roomId) => {
        this.handlePause(socket, roomId);
      });

      socket.on("requestControl", (roomId) => {
        this.handleRequestControl(socket, roomId);
      });

      // Media control events
      socket.on("seek", (data) => {
        this.handleSeek(socket, data);
      });

      socket.on("volumeChange", (data) => {
        this.handleVolumeChange(socket, data);
      });

      socket.on("syncTime", (data) => {
        this.handleSyncTime(socket, data);
      });

      // Playlist events
      socket.on("addTrack", (data) => {
        this.handleAddTrack(socket, data);
      });

      socket.on("changeTrack", (data) => {
        this.handleChangeTrack(socket, data);
      });

      socket.on("trackRemoved", (data) => {
        this.handleTrackRemoved(socket, data);
      });

      // YouTube events
      socket.on("searchYouTube", (data) => {
        this.handleYouTubeSearch(socket, data);
      });

      socket.on("addYouTubeTrack", (data) => {
        this.handleAddYouTubeTrack(socket, data);
      });

      // Sharing events
      socket.on("getShareLink", (roomId) => {
        this.handleGetShareLink(socket, roomId);
      });

      // Disconnect handling
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  handleJoinRoom(socket, roomId) {
    socket.join(roomId);
    const room = this.roomManager.joinRoom(roomId, socket.id);
    
    socket.emit("roomJoined", roomId);
    socket.emit("roomState", this.roomManager.getRoomState(roomId));

    // Broadcast user count update
    const userCount = room.users.size;
    this.io.to(roomId).emit("userCountUpdate", { userCount, roomId });

    console.log(`User ${socket.id} joined room ${roomId}. Total users: ${userCount}`);
  }

  handleLeaveRoom(socket, roomId) {
    socket.leave(roomId);
    const room = this.roomManager.leaveRoom(roomId, socket.id);

    if (room) {
      const userCount = room.users.size;
      this.io.to(roomId).emit("userCountUpdate", { userCount, roomId });
    }

    console.log(`User ${socket.id} left room ${roomId}`);
  }

  handlePlay(socket, roomId) {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    if (!room.controller) {
      room.controller = socket.id;
    }

    if (room.controller === socket.id) {
      room.isPlaying = true;
      room.lastActionTime = Date.now();
      room.lastActionBy = socket.id;

      this.io.to(roomId).emit("play", room.currentTime);

      if (room.currentTrack) {
        this.io.to(roomId).emit("trackChanged", room.currentTrack);
      }

      console.log(`User ${socket.id} started playback in room ${roomId} at time ${room.currentTime}`);
    } else {
      socket.emit("controlDenied", {
        message: "Another user is currently controlling playback",
        controller: room.controller,
      });
    }
  }

  handlePause(socket, roomId) {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    if (room.controller === socket.id) {
      room.isPlaying = false;
      room.lastActionTime = Date.now();
      room.lastActionBy = socket.id;

      this.io.to(roomId).emit("pause");
      console.log(`User ${socket.id} paused playback in room ${roomId}`);
    } else {
      socket.emit("controlDenied", {
        message: "Another user is currently controlling playback",
        controller: room.controller,
      });
    }
  }

  handleRequestControl(socket, roomId) {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    const now = Date.now();
    const controllerTimeout = 30000; // 30 seconds

    if (!room.controller || 
        !room.users.has(room.controller) || 
        (room.lastActionTime && (now - room.lastActionTime) > controllerTimeout)) {
      
      room.controller = socket.id;
      room.lastActionTime = now;

      this.io.to(roomId).emit("controllerChanged", { 
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

  handleSeek(socket, data) {
    const { roomId, time } = data;
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      room.currentTime = time;
      this.io.to(roomId).emit("seek", time);
    }
  }

  handleVolumeChange(socket, data) {
    const { roomId, volume } = data;
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      room.volume = volume;
      this.io.to(roomId).emit("volumeChange", volume);
    }
  }

  handleSyncTime(socket, data) {
    const { roomId, time } = data;
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      room.currentTime = time;
      this.io.to(roomId).emit("syncTime", time);
    }
  }

  handleAddTrack(socket, data) {
    const { roomId, track } = data;
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      room.playlist.push(track);
      if (!room.currentTrack) {
        room.currentTrack = track;
      }
      this.io.to(roomId).emit("playlistUpdate", room.playlist);
      this.io.to(roomId).emit("trackAdded", track);
    }
  }

  handleChangeTrack(socket, data) {
    const { roomId, trackIndex } = data;
    const room = this.roomManager.getRoom(roomId);
    if (room && room.playlist[trackIndex]) {
      room.currentTrack = room.playlist[trackIndex];
      room.currentTime = 0;
      room.isPlaying = false;
      this.io.to(roomId).emit("trackChanged", room.currentTrack);
      this.io.to(roomId).emit("pause");
    }
  }

  handleTrackRemoved(socket, data) {
    const { roomId, trackId } = data;
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      room.playlist = room.playlist.filter((track) => track.id !== trackId);

      if (room.currentTrack && room.currentTrack.id === trackId) {
        room.currentTrack = room.playlist.length > 0 ? room.playlist[0] : null;
      }

      this.io.to(roomId).emit("trackRemoved", { trackId });
      this.io.to(roomId).emit("playlistUpdate", room.playlist);
    }
  }

  async handleYouTubeSearch(socket, data) {
    try {
      const { query, roomId } = data;
      const results = await this.youtubeService.searchVideos(query);
      socket.emit("youtubeResults", { results, roomId });
    } catch (error) {
      console.error("YouTube search error:", error);
      socket.emit("youtubeError", {
        error: "Search failed",
        roomId: data.roomId,
      });
    }
  }

  async handleAddYouTubeTrack(socket, data) {
    try {
      const { videoId, roomId } = data;
      const track = await this.youtubeService.createTrackFromVideo(videoId);
      
      const room = this.roomManager.getRoom(roomId);
      if (room) {
        room.playlist.push(track);
        if (!room.currentTrack) {
          room.currentTrack = track;
        }
        this.io.to(roomId).emit("playlistUpdate", room.playlist);
        this.io.to(roomId).emit("trackAdded", track);
        socket.emit("youtubeTrackAdded", { track, roomId });
      }
    } catch (error) {
      console.error("YouTube track add error:", error);
      socket.emit("youtubeError", {
        error: "Failed to add YouTube track",
        roomId: data.roomId,
      });
    }
  }

  handleGetShareLink(socket, roomId) {
    const shareLink = this.roomManager.getShareLink(roomId);
    socket.emit("shareLink", { roomId, shareLink });
  }

  handleDisconnect(socket) {
    console.log("User disconnected:", socket.id);
    this.roomManager.handleUserDisconnect(socket.id, this.io);
  }
}

module.exports = { SocketHandler };