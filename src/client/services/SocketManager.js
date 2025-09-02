// Socket.IO Connection and Event Management
export class SocketManager {
  constructor(app) {
    this.app = app;
    this.socket = null;
  }

  initialize() {
    this.socket = io();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Connection events
    this.socket.on("connect", () => {
      this.app.uiManager.updateConnectionStatus(true);
    });

    this.socket.on("disconnect", () => {
      this.app.uiManager.updateConnectionStatus(false);
    });

    // Room events
    this.socket.on("roomJoined", (roomId) => {
      this.app.roomManager.handleRoomJoined(roomId);
    });

    this.socket.on("roomState", (roomState) => {
      this.app.roomManager.updateRoomState(roomState);
    });

    // Playback events
    this.socket.on("play", async (time) => {
      console.log("Received play event with time:", time);
      await this.app.audioManager.playMusicLocal(time);
    });

    this.socket.on("pause", () => {
      this.app.audioManager.pauseMusicLocal();
    });

    this.socket.on("seek", (time) => {
      this.app.audioManager.seekToTime(time);
    });

    this.socket.on("volumeChange", (volume) => {
      this.app.audioManager.setVolume(volume);
    });

    // Playlist events
    this.socket.on("playlistUpdate", (playlist) => {
      this.app.playlistManager.updatePlaylist(playlist);
    });

    this.socket.on("trackAdded", (track) => {
      this.app.playlistManager.addTrackToPlaylist(track);
    });

    this.socket.on("trackChanged", async (track) => {
      console.log("Received track change event:", track.name);
      await this.app.audioManager.changeTrack(track);
    });

    this.socket.on("trackRemoved", (data) => {
      this.app.playlistManager.removeTrackFromPlaylist(data.trackId);
    });

    // User events
    this.socket.on("userCountUpdate", (data) => {
      this.app.uiManager.updateUserCount(data.userCount);
    });

    this.socket.on("syncTime", (time) => {
      this.app.audioManager.syncTime(time);
    });

    // Control system events
    this.socket.on("controllerChanged", (data) => {
      this.app.uiManager.updateControlStatus(data);
    });

    this.socket.on("controlDenied", (data) => {
      this.app.uiManager.showControlDeniedMessage(data.message);
    });

    // YouTube events
    this.socket.on("youtubeResults", (data) => {
      this.app.youtubeManager.displayYouTubeResults(data.results);
    });

    this.socket.on("youtubeTrackAdded", (data) => {
      this.app.playlistManager.addTrackToPlaylist(data.track);
      alert(`Added YouTube track: ${data.track.name}`);
    });

    this.socket.on("youtubeError", (data) => {
      alert(`YouTube Error: ${data.error}`);
    });

    // Sharing events
    this.socket.on("shareLink", (data) => {
      this.app.sharingManager.updateShareLink(data.shareLink);
    });
  }

  emit(event, data) {
    this.socket.emit(event, data);
  }
}