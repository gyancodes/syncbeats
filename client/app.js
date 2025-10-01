// SyncBeats Client Application with Improved Synchronization
class SyncBeats {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.audio = new Audio();
    this.isPlaying = false;
    this.currentTrack = null;
    this.playlist = [];
    this.syncInterval = null;
    this.hasControl = false;
    this.isController = false;
    this.lastSyncTime = 0;
    this.syncThreshold = 0.5; // Sync if difference is more than 0.5 seconds

    this.initializeSocket();
    this.bindEvents();
    this.setupAudioEvents();
  }

  initializeSocket() {
    this.socket = io('http://localhost:3001');

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.updateConnectionStatus(true);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.updateConnectionStatus(false);
    });

    this.socket.on("roomJoined", (roomId) => {
      console.log("Joined room:", roomId);
      this.currentRoom = roomId;
      this.updateRoomStatus(roomId);
      this.showPlayerSection();
      this.showPlaylistSection();
    });

    this.socket.on("roomState", (roomState) => {
      console.log("Received room state:", roomState);
      this.updateRoomState(roomState);
    });

    // Playback events with improved sync
    this.socket.on("play", async (time) => {
      console.log("Received play event with time:", time);
      await this.playMusicLocal(time);
    });

    this.socket.on("pause", () => {
      console.log("Received pause event");
      this.pauseMusicLocal();
    });

    this.socket.on("seek", (time) => {
      console.log("Received seek event:", time);
      this.seekToTime(time);
    });

    this.socket.on("volumeChange", (volume) => {
      console.log("Received volume change:", volume);
      this.setVolume(volume);
    });

    // Playlist events
    this.socket.on("playlistUpdate", (playlist) => {
      console.log("Received playlist update:", playlist);
      this.updatePlaylist(playlist);
    });

    this.socket.on("trackAdded", (track) => {
      console.log("Received track added:", track);
      this.addTrackToPlaylist(track);
    });

    this.socket.on("trackChanged", async (track) => {
      console.log("Received track change event:", track);
      await this.changeTrack(track);
    });

    this.socket.on("trackRemoved", (data) => {
      console.log("Received track removed:", data);
      this.removeTrackFromPlaylist(data.trackId);
    });

    // User events
    this.socket.on("userCountUpdate", (data) => {
      console.log("User count update:", data);
      this.updateUserCount(data.userCount);
    });

    this.socket.on("syncTime", (time) => {
      console.log("Received sync time:", time);
      this.syncTime(time);
    });

    // Control system events
    this.socket.on("controllerChanged", (data) => {
      console.log("Controller changed:", data);
      this.updateControlStatus(data);
    });

    this.socket.on("controlDenied", (data) => {
      console.log("Control denied:", data);
      this.showControlDeniedMessage(data.message);
    });

    // YouTube events
    this.socket.on("youtubeResults", (data) => {
      console.log("YouTube results:", data);
      this.displayYouTubeResults(data.results);
    });

    this.socket.on("youtubeTrackAdded", (data) => {
      console.log("YouTube track added:", data);
      this.addTrackToPlaylist(data.track);
      this.showNotification(`Added YouTube track: ${data.track.name}`, 'success');
    });

    this.socket.on("youtubeError", (data) => {
      console.log("YouTube error:", data);
      this.showNotification(`YouTube Error: ${data.error}`, 'error');
    });

    // Sharing events
    this.socket.on("shareLink", (data) => {
      console.log("Share link received:", data);
      this.updateShareLink(data.shareLink);
    });
  }

  bindEvents() {
    // Room management
    document.getElementById("joinRoomBtn").addEventListener("click", () => {
      this.joinRoom();
    });

    document.getElementById("leaveRoomBtn").addEventListener("click", () => {
      this.leaveRoom();
    });

    // Player controls
    document.getElementById("playBtn").addEventListener("click", () => {
      this.playMusic();
    });

    document.getElementById("pauseBtn").addEventListener("click", () => {
      this.pauseMusic();
    });

    // Volume control
    document.getElementById("volumeSlider").addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      this.setVolume(volume);
      if (this.currentRoom) {
        this.socket.emit("volumeChange", { roomId: this.currentRoom, volume });
      }
    });

    // Seek control
    document.getElementById("seekSlider").addEventListener("input", (e) => {
      const seekTime = (e.target.value / 100) * this.audio.duration;
      this.seekToTime(seekTime);
    });

    // File upload
    document.getElementById("fileInput").addEventListener("change", (e) => {
      this.handleFileUpload(e.target.files);
    });

    // Drag and drop
    const uploadSection = document.getElementById("uploadSection");
    uploadSection.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadSection.classList.add("dragover");
    });

    uploadSection.addEventListener("dragleave", () => {
      uploadSection.classList.remove("dragover");
    });

    uploadSection.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadSection.classList.remove("dragover");
      this.handleFileUpload(e.dataTransfer.files);
    });

    // YouTube search
    document.getElementById("searchYoutubeBtn").addEventListener("click", () => {
      this.searchYouTube();
    });

    // Room sharing
    document.getElementById("shareRoomBtn").addEventListener("click", () => {
      this.showSharingSection();
    });

    document.getElementById("copyLinkBtn").addEventListener("click", () => {
      this.copyShareLink();
    });

    document.getElementById("shareWhatsAppBtn").addEventListener("click", () => {
      this.shareOnWhatsApp();
    });

    document.getElementById("shareTelegramBtn").addEventListener("click", () => {
      this.shareOnTelegram();
    });

    document.getElementById("shareEmailBtn").addEventListener("click", () => {
      this.shareViaEmail();
    });

    // Check for room parameter in URL
    this.checkUrlForRoom();
  }

  setupAudioEvents() {
    this.audio.addEventListener("loadedmetadata", () => {
      console.log("Audio metadata loaded");
      this.updateSeekSlider();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.updateTimeDisplay();
      this.updateSeekSlider();

      // Sync time with other users every 2 seconds
      if (this.isPlaying && this.currentRoom) {
        const now = Date.now();
        if (now - this.lastSyncTime > 2000) {
          this.socket.emit("syncTime", {
            roomId: this.currentRoom,
            time: this.audio.currentTime,
          });
          this.lastSyncTime = now;
        }
      }
    });

    this.audio.addEventListener("ended", () => {
      console.log("Track ended, playing next");
      this.playNextTrack();
    });

    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      console.error("Error playing audio:", e.target.error);

      if (this.currentTrack && this.currentTrack.type === "youtube") {
        console.log("YouTube track error, attempting to refresh URL...");
        this.refreshYouTubeUrl(this.currentTrack);
      } else {
        const errorMsg = e.target.error ? e.target.error.message : "Unknown error";
        console.error(`Audio file error: ${errorMsg}`);

        if (errorMsg.includes("404") || errorMsg.includes("not found")) {
          this.handleMissingFile();
        } else {
          this.showNotification("Error playing audio: " + errorMsg, 'error');
        }
      }
    });
  }

  joinRoom() {
    const roomId = document.getElementById("roomId").value.trim();
    if (!roomId) {
      this.showNotification("Please enter a room ID", 'error');
      return;
    }

    console.log("Joining room:", roomId);
    this.socket.emit("joinRoom", roomId);
  }

  leaveRoom() {
    if (this.currentRoom) {
      console.log("Leaving room:", this.currentRoom);
      this.socket.emit("leaveRoom", this.currentRoom);
      this.currentRoom = null;
      this.hidePlayerSection();
      this.hidePlaylistSection();
      this.updateRoomStatus(null);
      this.stopMusic();
    }
  }

  async playMusic(time = null) {
    if (!this.currentTrack) {
      this.showNotification("No track selected. Please upload music first.", 'error');
      return;
    }

    // Check if this is a user-initiated action (not from server sync)
    const isUserAction = time === null;

    // If user action, check if they have control or need to request it
    if (isUserAction && this.currentRoom) {
      if (!this.isController) {
        console.log("Requesting control to play music");
        this.socket.emit("requestControl", this.currentRoom);
        return;
      }
    }

    try {
      // Ensure audio is loaded and ready
      if (this.audio.readyState < 2) {
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            this.audio.removeEventListener("canplay", onCanPlay);
            this.audio.removeEventListener("error", onError);
            resolve();
          };
          const onError = () => {
            this.audio.removeEventListener("canplay", onCanPlay);
            this.audio.removeEventListener("error", onError);
            reject(new Error("Failed to load audio"));
          };
          this.audio.addEventListener("canplay", onCanPlay);
          this.audio.addEventListener("error", onError);
        });
      }

      // Set time if specified
      if (time !== null && isFinite(time)) {
        this.audio.currentTime = time;
      }

      // Play the audio
      await this.audio.play();
      this.isPlaying = true;
      this.updatePlayButton();
      this.startSyncInterval();

      // Only emit to other users if this user initiated the play and has control
      if (isUserAction && this.isController && this.currentRoom) {
        console.log("Emitting play event to room");
        this.socket.emit("play", this.currentRoom);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        this.showNotification("Error playing audio: " + error.message, 'error');
      }
    }
  }

  pauseMusic() {
    // Check if user has control
    if (this.currentRoom && !this.isController) {
      console.log("Requesting control to pause music");
      this.socket.emit("requestControl", this.currentRoom);
      return;
    }

    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    this.stopSyncInterval();

    // Only emit if user has control
    if (this.currentRoom && this.isController) {
      console.log("Emitting pause event to room");
      this.socket.emit("pause", this.currentRoom);
    }
  }

  pauseMusicLocal() {
    console.log("Pausing music locally (from server sync)");
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    this.stopSyncInterval();
  }

  async playMusicLocal(time = null) {
    if (!this.currentTrack) {
      console.log("No current track to play locally");
      return;
    }

    try {
      console.log("Playing locally:", this.currentTrack.name, "at time:", time);
      
      // Ensure audio source is set
      if (this.audio.src !== this.currentTrack.url) {
        console.log("Setting audio source:", this.currentTrack.url);
        this.audio.src = this.currentTrack.url;
        this.audio.load();
      }

      // Wait for audio to be ready
      if (this.audio.readyState < 2) {
        console.log("Waiting for audio to load...");
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.audio.removeEventListener("canplay", onCanPlay);
            this.audio.removeEventListener("error", onError);
            reject(new Error("Audio load timeout"));
          }, 10000);

          const onCanPlay = () => {
            clearTimeout(timeout);
            this.audio.removeEventListener("canplay", onCanPlay);
            this.audio.removeEventListener("error", onError);
            console.log("Audio loaded successfully");
            resolve();
          };
          
          const onError = (e) => {
            clearTimeout(timeout);
            this.audio.removeEventListener("canplay", onCanPlay);
            this.audio.removeEventListener("error", onError);
            console.error("Audio load error:", e);
            reject(new Error("Failed to load audio"));
          };

          if (this.audio.readyState >= 2) {
            clearTimeout(timeout);
            resolve();
          } else {
            this.audio.addEventListener("canplay", onCanPlay);
            this.audio.addEventListener("error", onError);
          }
        });
      }

      // Set time if specified
      if (time !== null && isFinite(time)) {
        console.log("Setting audio time to:", time);
        this.audio.currentTime = time;
      }

      // Play the audio
      console.log("Starting audio playback...");
      await this.audio.play();
      this.isPlaying = true;
      this.updatePlayButton();
      this.startSyncInterval();

      console.log("Audio playing successfully");
    } catch (error) {
      console.error("Error playing audio locally:", error);
      
      if (this.currentTrack && this.currentTrack.type === "youtube") {
        console.log("YouTube track error, attempting to refresh URL...");
        this.refreshYouTubeUrl(this.currentTrack);
      } else {
        this.showNotification("Error playing audio: " + error.message, 'error');
      }
    }
  }

  stopMusic() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.updatePlayButton();
    this.stopSyncInterval();
  }

  seekToTime(time) {
    if (this.audio.duration) {
      this.audio.currentTime = time;
      if (this.currentRoom) {
        this.socket.emit("seek", { roomId: this.currentRoom, time });
      }
    }
  }

  setVolume(volume) {
    this.audio.volume = volume;
    document.getElementById("volumeSlider").value = volume * 100;
    document.getElementById("volumeValue").textContent = Math.round(volume * 100) + "%";
  }

  async changeTrack(track) {
    console.log("Changing track to:", track.name, "URL:", track.url);
    
    // Stop current playback first
    this.pauseMusicLocal();

    this.currentTrack = track;

    try {
      // Set the new source
      this.audio.src = track.url;
      this.updateCurrentTrackDisplay();
      
      // Force load the new audio
      this.audio.load();

      // Wait for the audio to be ready with timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.audio.removeEventListener("canplaythrough", onCanPlay);
          this.audio.removeEventListener("error", onError);
          reject(new Error("Track load timeout"));
        }, 15000);

        const onCanPlay = () => {
          clearTimeout(timeout);
          this.audio.removeEventListener("canplaythrough", onCanPlay);
          this.audio.removeEventListener("error", onError);
          console.log("Track loaded successfully:", track.name);
          resolve();
        };
        
        const onError = (e) => {
          clearTimeout(timeout);
          this.audio.removeEventListener("canplaythrough", onCanPlay);
          this.audio.removeEventListener("error", onError);
          console.error("Track load error:", e);
          reject(e);
        };

        if (this.audio.readyState >= 3) {
          clearTimeout(timeout);
          console.log("Track already loaded:", track.name);
          resolve();
        } else {
          this.audio.addEventListener("canplaythrough", onCanPlay);
          this.audio.addEventListener("error", onError);
        }
      });

    } catch (error) {
      console.error("Error loading track:", error);
      if (track.type === "youtube") {
        console.log("Attempting to refresh YouTube URL...");
        this.refreshYouTubeUrl(track);
      } else {
        this.showNotification("Error loading track: " + track.name, 'error');
      }
    }
  }

  playNextTrack() {
    if (this.playlist.length > 0) {
      const currentIndex = this.playlist.findIndex(
        (track) => track.id === this.currentTrack?.id
      );
      const nextIndex = (currentIndex + 1) % this.playlist.length;
      const nextTrack = this.playlist[nextIndex];

      if (nextTrack) {
        this.changeTrack(nextTrack);
        if (this.isPlaying) {
          this.playMusic();
        }
      }
    }
  }

  loadAudio() {
    this.audio.load();
    this.updateCurrentTrackDisplay();
  }

  handleFileUpload(files) {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        this.uploadFile(file);
      } else {
        this.showNotification(`${file.name} is not an audio file`, 'error');
      }
    });
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("audio", file);

    this.showUploadProgress();

    try {
      const response = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const track = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: result.fileUrl,
          size: result.size,
          type: file.type,
        };

        this.addTrackToPlaylist(track);

        if (this.currentRoom) {
          this.socket.emit("addTrack", { roomId: this.currentRoom, track });
        }

        if (!this.currentTrack) {
          this.currentTrack = track;
          this.loadAudio();
        }

        this.showNotification(`Uploaded: ${file.name}`, 'success');
      } else {
        this.showNotification("Upload failed: " + result.error, 'error');
      }
    } catch (error) {
      console.error("Upload error:", error);
      this.showNotification("Upload failed. Please try again.", 'error');
    } finally {
      this.hideUploadProgress();
    }
  }

  addTrackToPlaylist(track) {
    this.playlist.push(track);
    this.updatePlaylistDisplay();
  }

  removeTrackFromPlaylist(trackId) {
    this.playlist = this.playlist.filter((track) => track.id !== trackId);
    this.updatePlaylistDisplay();

    if (this.currentTrack && this.currentTrack.id === trackId) {
      if (this.playlist.length > 0) {
        this.playNextTrack();
      } else {
        this.currentTrack = null;
        this.updateCurrentTrackDisplay();
      }
    }
  }

  updatePlaylist(playlist) {
    this.playlist = playlist;
    this.updatePlaylistDisplay();
  }

  updatePlaylistDisplay() {
    const playlistElement = document.getElementById("playlist");

    if (this.playlist.length === 0) {
      playlistElement.innerHTML =
        '<p style="text-align: center; color: #6c757d; font-style: italic;">No tracks in playlist yet</p>';
      return;
    }

    playlistElement.innerHTML = this.playlist
      .map(
        (track, index) => `
            <div class="playlist-item ${
              track.id === this.currentTrack?.id ? "current" : ""
            }">
                <div>
                    <strong>${track.name}</strong>
                    <br>
                    <small>${
                      track.type === "youtube"
                        ? "YouTube Video"
                        : this.formatFileSize(track.size)
                    }</small>
                    ${
                      track.type === "youtube" && track.thumbnail
                        ? `<br><img src="${track.thumbnail}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; margin-top: 5px;">`
                        : ""
                    }
                </div>
                <div>
                    <button class="btn btn-secondary" onclick="syncBeats.playTrack(${index})">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    this.updateRoomStats();
  }

  playTrack(index) {
    const track = this.playlist[index];
    if (track) {
      this.changeTrack(track);
      if (this.currentRoom) {
        this.socket.emit("changeTrack", {
          roomId: this.currentRoom,
          trackIndex: index,
        });
      }
      this.playMusic();
    }
  }

  async updateRoomState(roomState) {
    console.log("Updating room state:", roomState);
    
    this.playlist = roomState.playlist || [];
    this.isPlaying = roomState.isPlaying;
    this.audio.volume = roomState.volume || 1;

    // Update control status
    this.isController = roomState.controller === this.socket.id;
    this.hasControl = roomState.controller !== null;

    this.updatePlaylistDisplay();
    this.updateVolumeDisplay();
    
    // Update control status UI
    this.updateControlStatus({
      controller: roomState.controller,
      isYou: this.isController
    });

    // Handle current track change
    if (roomState.currentTrack && 
        (!this.currentTrack || this.currentTrack.id !== roomState.currentTrack.id)) {
      console.log("Room has different current track, changing to:", roomState.currentTrack.name);
      await this.changeTrack(roomState.currentTrack);
    } else if (this.currentTrack) {
      this.updateCurrentTrackDisplay();
    }

    // Sync playback state
    if (roomState.isPlaying && !this.isPlaying && this.currentTrack) {
      console.log("Room is playing, starting local playback");
      await this.playMusicLocal(roomState.currentTime);
    } else if (!roomState.isPlaying && this.isPlaying) {
      console.log("Room is paused, pausing local playback");
      this.pauseMusicLocal();
    }
  }

  startSyncInterval() {
    this.stopSyncInterval();
    this.syncInterval = setInterval(() => {
      if (this.isPlaying && this.currentRoom) {
        this.socket.emit("syncTime", {
          roomId: this.currentRoom,
          time: this.audio.currentTime,
        });
      }
    }, 2000);
  }

  stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  syncTime(time) {
    const timeDiff = Math.abs(this.audio.currentTime - time);
    if (timeDiff > this.syncThreshold) {
      console.log(`Syncing time: ${this.audio.currentTime} -> ${time} (diff: ${timeDiff})`);
      this.audio.currentTime = time;
    }
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById("connectionStatus");
    if (connected) {
      statusElement.className = "status connected";
      statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
    } else {
      statusElement.className = "status disconnected";
      statusElement.innerHTML =
        '<i class="fas fa-times-circle"></i> Disconnected';
    }
  }

  updateRoomStatus(roomId) {
    const roomStatusElement = document.getElementById("roomStatus");
    const currentRoomElement = document.getElementById("currentRoom");
    const shareRoomBtn = document.getElementById("shareRoomBtn");

    if (roomId) {
      roomStatusElement.classList.remove("hidden");
      currentRoomElement.textContent = roomId;
      shareRoomBtn.style.display = "inline-flex";
      this.updateRoomStats();
    } else {
      roomStatusElement.classList.add("hidden");
      shareRoomBtn.style.display = "none";
      document.getElementById("sharingSection").style.display = "none";
    }
  }

  showPlayerSection() {
    document.getElementById("playerSection").classList.remove("hidden");
    document.getElementById("noRoomMessage").classList.add("hidden");
  }

  hidePlayerSection() {
    document.getElementById("playerSection").classList.add("hidden");
    document.getElementById("noRoomMessage").classList.remove("hidden");
  }

  showPlaylistSection() {
    document.getElementById("playlistSection").classList.remove("hidden");
  }

  hidePlaylistSection() {
    document.getElementById("playlistSection").classList.add("hidden");
  }

  updatePlayButton() {
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");

    if (this.isPlaying) {
      playBtn.style.display = "none";
      pauseBtn.style.display = "inline-flex";
    } else {
      playBtn.style.display = "inline-flex";
      pauseBtn.style.display = "none";
    }
  }

  updateCurrentTrackDisplay() {
    const currentTrackElement = document.getElementById("currentTrack");
    if (this.currentTrack) {
      currentTrackElement.textContent = this.currentTrack.name;
    } else {
      currentTrackElement.textContent = "No track selected";
    }
  }

  updateVolumeDisplay() {
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    volumeSlider.value = this.audio.volume * 100;
    volumeValue.textContent = Math.round(this.audio.volume * 100) + "%";
  }

  updateTimeDisplay() {
    const timeDisplay = document.getElementById("timeDisplay");
    const currentTime = this.formatTime(this.audio.currentTime);
    const duration = this.formatTime(this.audio.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
  }

  updateSeekSlider() {
    const seekSlider = document.getElementById("seekSlider");
    if (this.audio.duration && isFinite(this.audio.duration)) {
      seekSlider.max = this.audio.duration;
      seekSlider.value = this.audio.currentTime;
    }
  }

  showUploadProgress() {
    document.getElementById("uploadProgress").classList.remove("hidden");
    document.getElementById("uploadStatus").textContent = "Uploading...";
  }

  hideUploadProgress() {
    document.getElementById("uploadProgress").classList.add("hidden");
    document.getElementById("progressFill").style.width = "0%";
  }

  formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // YouTube Methods
  searchYouTube() {
    const query = document.getElementById("youtubeSearch").value.trim();
    if (!query) {
      this.showNotification("Please enter a search term", 'error');
      return;
    }

    if (!this.currentRoom) {
      this.showNotification("Please join a room first", 'error');
      return;
    }

    this.socket.emit("searchYouTube", { query, roomId: this.currentRoom });
    document.getElementById("youtubeResults").classList.remove("hidden");
  }

  displayYouTubeResults(results) {
    const resultsList = document.getElementById("youtubeResultsList");

    if (results.length === 0) {
      resultsList.innerHTML = "<p>No results found</p>";
      return;
    }

    resultsList.innerHTML = results
      .map(
        (video) => `
            <div class="youtube-result-item">
                <img src="${video.thumbnail}" alt="${
          video.title
        }" class="youtube-thumbnail">
                <div class="youtube-info">
                    <div class="youtube-title">${video.title}</div>
                    <div class="youtube-duration">${this.formatTime(
                      video.duration
                    )}</div>
                </div>
                <button class="youtube-add-btn" onclick="syncBeats.addYouTubeTrack('${
                  video.videoId
                }')">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        `
      )
      .join("");
  }

  addYouTubeTrack(videoId) {
    if (!this.currentRoom) {
      this.showNotification("Please join a room first", 'error');
      return;
    }

    this.socket.emit("addYouTubeTrack", { videoId, roomId: this.currentRoom });
  }

  async refreshYouTubeUrl(track) {
    try {
      const videoId = track.id.replace("yt_", "");
      const response = await fetch(`http://localhost:3001/api/youtube/${videoId}`);
      const data = await response.json();

      if (data.url) {
        track.url = data.url;
        this.audio.src = data.url;
        this.loadAudio();
        console.log("YouTube URL refreshed successfully");
      } else {
        throw new Error(data.error || "Failed to refresh URL");
      }
    } catch (error) {
      console.error("Failed to refresh YouTube URL:", error);
      this.showNotification(
        "Failed to play YouTube track. The video might be unavailable or restricted.",
        'error'
      );
    }
  }

  handleMissingFile() {
    if (this.currentTrack) {
      console.log(
        `Removing missing file from playlist: ${this.currentTrack.name}`
      );

      // Remove from local playlist
      this.playlist = this.playlist.filter(
        (track) => track.id !== this.currentTrack.id
      );

      // Update display
      this.updatePlaylistDisplay();

      // Try to play next track
      if (this.playlist.length > 0) {
        this.playNextTrack();
      } else {
        this.currentTrack = null;
        this.updateCurrentTrackDisplay();
        this.showNotification("Audio file not found and has been removed from playlist.", 'error');
      }

      // Notify other users in room
      if (this.currentRoom) {
        this.socket.emit("trackRemoved", {
          roomId: this.currentRoom,
          trackId: this.currentTrack.id,
        });
      }
    }
  }

  // Sharing Methods
  showSharingSection() {
    document.getElementById("sharingSection").style.display = "block";
    this.socket.emit("getShareLink", this.currentRoom);
  }

  updateShareLink(shareLink) {
    document.getElementById("shareLink").value = shareLink;
  }

  copyShareLink() {
    const shareLink = document.getElementById("shareLink");
    shareLink.select();
    document.execCommand("copy");
    this.showNotification("Link copied to clipboard!", 'success');
  }

  shareOnWhatsApp() {
    const shareLink = document.getElementById("shareLink").value;
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  }

  shareOnTelegram() {
    const shareLink = document.getElementById("shareLink").value;
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      shareLink
    )}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank");
  }

  shareViaEmail() {
    const shareLink = document.getElementById("shareLink").value;
    const subject = "Join me on SyncBeats! 🎵";
    const body = `Hey! I'm listening to music on SyncBeats and would love for you to join!\n\nClick this link to join: ${shareLink}\n\nSee you there! 🎶`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  // URL Room Detection
  checkUrlForRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    if (roomParam) {
      document.getElementById("roomId").value = roomParam;
      // Auto-join after a short delay to ensure socket is connected
      setTimeout(() => {
        this.joinRoom();
      }, 1000);
    }
  }

  // Enhanced room status updates
  updateRoomStats() {
    if (this.currentRoom) {
      document.getElementById("trackCount").textContent = this.playlist.length;
    }
  }

  updateUserCount(userCount) {
    if (this.currentRoom) {
      document.getElementById("userCount").textContent = userCount;
    }
  }

  updateControlStatus(data) {
    this.isController = data.isYou;
    this.hasControl = data.controller !== null;

    // Update UI to show control status
    const controlStatus = document.getElementById("controlStatus");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");

    if (!controlStatus) {
      // Create control status element if it doesn't exist
      const statusElement = document.createElement("div");
      statusElement.id = "controlStatus";
      statusElement.className = "control-status";
      document.getElementById("playerControls").appendChild(statusElement);
    }

    if (data.isYou) {
      document.getElementById("controlStatus").innerHTML = 
        '<i class="fas fa-crown"></i> You have control';
      document.getElementById("controlStatus").className = "control-status has-control";
      playBtn.disabled = false;
      pauseBtn.disabled = false;
    } else if (data.controller) {
      document.getElementById("controlStatus").innerHTML = 
        '<i class="fas fa-hand-paper"></i> Another user has control - Click to request';
      document.getElementById("controlStatus").className = "control-status no-control clickable";
      document.getElementById("controlStatus").onclick = () => {
        this.socket.emit("requestControl", this.currentRoom);
      };
      playBtn.disabled = true;
      pauseBtn.disabled = true;
    } else {
      document.getElementById("controlStatus").innerHTML = 
        '<i class="fas fa-play-circle"></i> Click play to take control';
      document.getElementById("controlStatus").className = "control-status no-control";
      document.getElementById("controlStatus").onclick = null;
      playBtn.disabled = false;
      pauseBtn.disabled = false;
    }
  }

  showControlDeniedMessage(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.syncBeats = new SyncBeats();
});

// Handle page visibility changes to pause music when tab is not active
document.addEventListener("visibilitychange", () => {
  if (document.hidden && window.syncBeats && window.syncBeats.isPlaying) {
    // Optionally pause music when tab is not visible
    // window.syncBeats.pauseMusic();
  }
});
