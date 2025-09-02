// User Interface Management and DOM Manipulation
export class UIManager {
  constructor(app) {
    this.app = app;
  }

  bindEvents() {
    // Room management
    document.getElementById("joinRoomBtn").addEventListener("click", () => {
      const roomId = document.getElementById("roomId").value.trim();
      if (!roomId) {
        alert("Please enter a room ID");
        return;
      }
      this.app.joinRoom(roomId);
    });

    document.getElementById("leaveRoomBtn").addEventListener("click", () => {
      this.app.leaveRoom();
    });

    // Player controls
    document.getElementById("playBtn").addEventListener("click", () => {
      this.app.playMusic();
    });

    document.getElementById("pauseBtn").addEventListener("click", () => {
      this.app.pauseMusic();
    });

    // Volume control
    document.getElementById("volumeSlider").addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      this.app.audioManager.setVolume(volume);
      this.app.socketManager.emit("volumeChange", { 
        roomId: this.app.currentRoom, 
        volume 
      });
    });

    // Seek control
    document.getElementById("seekSlider").addEventListener("input", (e) => {
      const seekTime = (e.target.value / 100) * this.app.audio.duration;
      this.app.audioManager.seekToTime(seekTime);
    });

    // File upload
    document.getElementById("fileInput").addEventListener("change", (e) => {
      this.app.handleFileUpload(e.target.files);
    });

    // Drag and drop
    this.setupDragAndDrop();

    // YouTube search
    document.getElementById("searchYoutubeBtn").addEventListener("click", () => {
      this.app.searchYouTube();
    });

    // Room sharing
    this.setupSharingEvents();

    // Check for room parameter in URL
    this.checkUrlForRoom();
  }

  setupDragAndDrop() {
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
      this.app.handleFileUpload(e.dataTransfer.files);
    });
  }

  setupSharingEvents() {
    document.getElementById("shareRoomBtn").addEventListener("click", () => {
      this.app.showSharingSection();
    });

    document.getElementById("copyLinkBtn").addEventListener("click", () => {
      this.app.copyShareLink();
    });

    document.getElementById("shareWhatsAppBtn").addEventListener("click", () => {
      this.app.shareOnWhatsApp();
    });

    document.getElementById("shareTelegramBtn").addEventListener("click", () => {
      this.app.shareOnTelegram();
    });

    document.getElementById("shareEmailBtn").addEventListener("click", () => {
      this.app.shareViaEmail();
    });
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById("connectionStatus");
    if (connected) {
      statusElement.className = "status connected";
      statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
    } else {
      statusElement.className = "status disconnected";
      statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Disconnected';
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

    if (this.app.audioManager.isPlaying) {
      playBtn.style.display = "none";
      pauseBtn.style.display = "inline-flex";
    } else {
      playBtn.style.display = "inline-flex";
      pauseBtn.style.display = "none";
    }
  }

  updateCurrentTrackDisplay() {
    const currentTrackElement = document.getElementById("currentTrack");
    if (this.app.audioManager.currentTrack) {
      currentTrackElement.textContent = this.app.audioManager.currentTrack.name;
    } else {
      currentTrackElement.textContent = "No track selected";
    }
  }

  updateVolumeDisplay(volume = null) {
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");
    const currentVolume = volume !== null ? volume : this.app.audio.volume;
    
    volumeSlider.value = currentVolume * 100;
    volumeValue.textContent = Math.round(currentVolume * 100) + "%";
  }

  updateTimeDisplay() {
    const timeDisplay = document.getElementById("timeDisplay");
    const currentTime = this.formatTime(this.app.audio.currentTime);
    const duration = this.formatTime(this.app.audio.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
  }

  updateSeekSlider() {
    const seekSlider = document.getElementById("seekSlider");
    if (this.app.audio.duration && isFinite(this.app.audio.duration)) {
      seekSlider.max = this.app.audio.duration;
      seekSlider.value = this.app.audio.currentTime;
    }
  }

  updatePlaylistDisplay() {
    const playlistElement = document.getElementById("playlist");

    if (this.app.playlistManager.playlist.length === 0) {
      playlistElement.innerHTML = 
        '<p style="text-align: center; color: #6c757d; font-style: italic;">No tracks in playlist yet</p>';
      return;
    }

    playlistElement.innerHTML = this.app.playlistManager.playlist
      .map((track, index) => `
        <div class="playlist-item ${
          track.id === this.app.audioManager.currentTrack?.id ? "current" : ""
        }">
          <div>
            <strong>${track.name}</strong>
            <br>
            <small>${
              track.type === "youtube"
                ? "YouTube Video"
                : this.app.playlistManager.formatFileSize(track.size)
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
      `)
      .join("");

    this.updateRoomStats();
  }

  updateRoomStats() {
    if (this.app.currentRoom) {
      document.getElementById("trackCount").textContent = this.app.playlistManager.playlist.length;
    }
  }

  updateUserCount(userCount) {
    if (this.app.currentRoom) {
      document.getElementById("userCount").textContent = userCount;
    }
  }

  updateControlStatus(data) {
    this.app.isController = data.isYou;
    this.app.hasControl = data.controller !== null;

    const controlStatus = document.getElementById("controlStatus");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");

    if (!controlStatus) {
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
        this.app.socketManager.emit("requestControl", this.app.currentRoom);
      };
      playBtn.disabled = true;
      pauseBtn.disabled = true;
    } else {
      document.getElementById("controlStatus").innerHTML = 
        '<i class="fas fa-play-circle"></i> Click play to take control';
      document.getElementById("controlStatus").className = "control-status available";
      playBtn.disabled = false;
      pauseBtn.disabled = false;
    }
  }

  showControlDeniedMessage(message) {
    alert(message);
  }

  showUploadProgress() {
    document.getElementById("uploadProgress").classList.remove("hidden");
    document.getElementById("uploadStatus").textContent = "Uploading...";
  }

  hideUploadProgress() {
    document.getElementById("uploadProgress").classList.add("hidden");
    document.getElementById("progressFill").style.width = "0%";
  }

  checkUrlForRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    if (roomParam) {
      document.getElementById("roomId").value = roomParam;
      setTimeout(() => {
        this.app.joinRoom(roomParam);
      }, 1000);
    }
  }

  formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}