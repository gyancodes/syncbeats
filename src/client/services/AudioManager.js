// Audio Playback and Control Management
export class AudioManager {
  constructor(app) {
    this.app = app;
    this.audio = new Audio();
    this.isPlaying = false;
    this.currentTrack = null;
    this.syncInterval = null;
  }

  setupAudioEvents() {
    this.audio.addEventListener("loadedmetadata", () => {
      this.app.uiManager.updateSeekSlider();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.app.uiManager.updateTimeDisplay();
      this.app.uiManager.updateSeekSlider();

      // Sync time with other users every 2 seconds
      if (this.isPlaying && this.app.currentRoom) {
        this.app.socketManager.emit("syncTime", {
          roomId: this.app.currentRoom,
          time: this.audio.currentTime,
        });
      }
    });

    this.audio.addEventListener("ended", () => {
      this.app.playlistManager.playNextTrack();
    });

    this.audio.addEventListener("error", (e) => {
      this.handleAudioError(e);
    });
  }

  handleAudioError(e) {
    console.error("Audio error:", e);
    console.error("Error playing audio:", e.target.error);

    if (this.currentTrack && this.currentTrack.type === "youtube") {
      console.log("YouTube track error, attempting to refresh URL...");
      this.app.youtubeManager.refreshYouTubeUrl(this.currentTrack);
    } else {
      const errorMsg = e.target.error ? e.target.error.message : "Unknown error";
      console.error(`Audio file error: ${errorMsg}`);

      if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        this.handleMissingFile();
      } else {
        alert("Error playing audio: " + errorMsg);
      }
    }
  }

  async playMusic(time = null) {
    if (!this.currentTrack) {
      alert("No track selected. Please upload music first.");
      return;
    }

    const isUserAction = time === null;

    if (isUserAction && this.app.currentRoom) {
      if (!this.app.isController) {
        this.app.socketManager.emit("requestControl", this.app.currentRoom);
        return;
      }
    }

    try {
      if (this.audio.readyState < 2) {
        await this.waitForAudioReady();
      }

      if (time !== null && isFinite(time)) {
        this.audio.currentTime = time;
      }

      await this.audio.play();
      this.isPlaying = true;
      this.app.uiManager.updatePlayButton();
      this.startSyncInterval();

      if (isUserAction && this.app.isController && this.app.currentRoom) {
        this.app.socketManager.emit("play", this.app.currentRoom);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        alert("Error playing audio: " + error.message);
      }
    }
  }

  pauseMusic() {
    if (this.app.currentRoom && !this.app.isController) {
      this.app.socketManager.emit("requestControl", this.app.currentRoom);
      return;
    }

    this.audio.pause();
    this.isPlaying = false;
    this.app.uiManager.updatePlayButton();
    this.stopSyncInterval();

    if (this.app.currentRoom && this.app.isController) {
      this.app.socketManager.emit("pause", this.app.currentRoom);
    }
  }

  pauseMusicLocal() {
    this.audio.pause();
    this.isPlaying = false;
    this.app.uiManager.updatePlayButton();
    this.stopSyncInterval();
  }

  async playMusicLocal(time = null) {
    if (!this.currentTrack) return;

    try {
      console.log("Playing locally:", this.currentTrack.name, "at time:", time);
      
      if (this.audio.src !== this.currentTrack.url) {
        console.log("Setting audio source:", this.currentTrack.url);
        this.audio.src = this.currentTrack.url;
        this.audio.load();
      }

      if (this.audio.readyState < 2) {
        console.log("Waiting for audio to load...");
        await this.waitForAudioReady(10000);
      }

      if (time !== null && isFinite(time)) {
        console.log("Setting audio time to:", time);
        this.audio.currentTime = time;
      }

      console.log("Starting audio playback...");
      await this.audio.play();
      this.isPlaying = true;
      this.app.uiManager.updatePlayButton();
      this.startSyncInterval();

      console.log("Audio playing successfully");
    } catch (error) {
      console.error("Error playing audio locally:", error);
      
      if (this.currentTrack && this.currentTrack.type === "youtube") {
        console.log("YouTube track error, attempting to refresh URL...");
        this.app.youtubeManager.refreshYouTubeUrl(this.currentTrack);
      } else {
        alert("Error playing audio: " + error.message);
      }
    }
  }

  async changeTrack(track) {
    console.log("Changing track to:", track.name, "URL:", track.url);
    
    this.pauseMusicLocal();
    this.currentTrack = track;

    try {
      this.audio.src = track.url;
      this.app.uiManager.updateCurrentTrackDisplay();
      this.audio.load();

      await this.waitForAudioReady(15000);
    } catch (error) {
      console.error("Error loading track:", error);
      if (track.type === "youtube") {
        console.log("Attempting to refresh YouTube URL...");
        this.app.youtubeManager.refreshYouTubeUrl(track);
      } else {
        alert("Error loading track: " + track.name);
      }
    }
  }

  async waitForAudioReady(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.audio.removeEventListener("canplay", onCanPlay);
        this.audio.removeEventListener("error", onError);
        reject(new Error("Audio load timeout"));
      }, timeout);

      const onCanPlay = () => {
        clearTimeout(timeoutId);
        this.audio.removeEventListener("canplay", onCanPlay);
        this.audio.removeEventListener("error", onError);
        resolve();
      };
      
      const onError = (e) => {
        clearTimeout(timeoutId);
        this.audio.removeEventListener("canplay", onCanPlay);
        this.audio.removeEventListener("error", onError);
        reject(new Error("Failed to load audio"));
      };

      if (this.audio.readyState >= 2) {
        clearTimeout(timeoutId);
        resolve();
      } else {
        this.audio.addEventListener("canplay", onCanPlay);
        this.audio.addEventListener("error", onError);
      }
    });
  }

  stopMusic() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.app.uiManager.updatePlayButton();
    this.stopSyncInterval();
  }

  seekToTime(time) {
    if (this.audio.duration) {
      this.audio.currentTime = time;
      if (this.app.currentRoom) {
        this.app.socketManager.emit("seek", { roomId: this.app.currentRoom, time });
      }
    }
  }

  setVolume(volume) {
    this.audio.volume = volume;
    this.app.uiManager.updateVolumeDisplay(volume);
  }

  startSyncInterval() {
    this.stopSyncInterval();
    this.syncInterval = setInterval(() => {
      if (this.isPlaying && this.app.currentRoom) {
        this.app.socketManager.emit("syncTime", {
          roomId: this.app.currentRoom,
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
    if (Math.abs(this.audio.currentTime - time) > 1) {
      this.audio.currentTime = time;
    }
  }

  handleMissingFile() {
    if (this.currentTrack) {
      console.log(`Removing missing file from playlist: ${this.currentTrack.name}`);
      
      this.app.playlistManager.removeTrackFromPlaylist(this.currentTrack.id);
      
      if (this.app.playlistManager.playlist.length > 0) {
        this.app.playlistManager.playNextTrack();
      } else {
        this.currentTrack = null;
        this.app.uiManager.updateCurrentTrackDisplay();
        alert("Audio file not found and has been removed from playlist.");
      }

      if (this.app.currentRoom) {
        this.app.socketManager.emit("trackRemoved", {
          roomId: this.app.currentRoom,
          trackId: this.currentTrack.id,
        });
      }
    }
  }
}