const roomManager = require("./roomManager");

/**
 * Register sync event handlers for a socket
 */
function registerSyncHandlers(io, socket) {
  // Handle play event
  socket.on("sync:play", (data) => {
    const { roomCode, currentTime } = data;

    roomManager.updatePlaybackState(roomCode, {
      isPlaying: true,
      currentTime: currentTime,
    });

    // Broadcast to all users in room except sender
    socket.to(roomCode).emit("sync:play", {
      currentTime,
      timestamp: Date.now(),
    });
  });

  // Handle pause event
  socket.on("sync:pause", (data) => {
    const { roomCode, currentTime } = data;

    roomManager.updatePlaybackState(roomCode, {
      isPlaying: false,
      currentTime: currentTime,
    });

    socket.to(roomCode).emit("sync:pause", {
      currentTime,
      timestamp: Date.now(),
    });
  });

  // Handle seek event
  socket.on("sync:seek", (data) => {
    const { roomCode, currentTime } = data;

    roomManager.updatePlaybackState(roomCode, {
      currentTime: currentTime,
    });

    socket.to(roomCode).emit("sync:seek", {
      currentTime,
      timestamp: Date.now(),
    });
  });

  // Handle track change
  socket.on("sync:track-change", (data) => {
    const { roomCode, track } = data;

    roomManager.updatePlaybackState(roomCode, {
      currentTrack: track,
      currentTime: 0,
      isPlaying: true,
    });

    socket.to(roomCode).emit("sync:track-change", {
      track,
      timestamp: Date.now(),
    });
  });

  // Get current state (for users who just joined)
  socket.on("sync:get-state", (data, callback) => {
    const { roomCode } = data;
    const state = roomManager.getPlaybackState(roomCode);

    if (callback && typeof callback === "function") {
      callback(state);
    }
  });
}

module.exports = { registerSyncHandlers };
