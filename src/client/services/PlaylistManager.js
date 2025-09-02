// Playlist and Track Management
export class PlaylistManager {
  constructor(app) {
    this.app = app;
    this.playlist = [];
  }

  handleFileUpload(files) {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        this.uploadFile(file);
      } else {
        alert(`${file.name} is not an audio file`);
      }
    });
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("audio", file);

    this.app.uiManager.showUploadProgress();

    try {
      const response = await fetch("/upload", {
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

        if (this.app.currentRoom) {
          this.app.socketManager.emit("addTrack", { 
            roomId: this.app.currentRoom, 
            track 
          });
        }

        if (!this.app.audioManager.currentTrack) {
          this.app.audioManager.currentTrack = track;
          this.app.audioManager.audio.src = track.url;
          this.app.audioManager.audio.load();
          this.app.uiManager.updateCurrentTrackDisplay();
        }
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      this.app.uiManager.hideUploadProgress();
    }
  }

  addTrackToPlaylist(track) {
    this.playlist.push(track);
    this.app.uiManager.updatePlaylistDisplay();
  }

  removeTrackFromPlaylist(trackId) {
    this.playlist = this.playlist.filter((track) => track.id !== trackId);
    this.app.uiManager.updatePlaylistDisplay();

    if (this.app.audioManager.currentTrack && 
        this.app.audioManager.currentTrack.id === trackId) {
      if (this.playlist.length > 0) {
        this.playNextTrack();
      } else {
        this.app.audioManager.currentTrack = null;
        this.app.uiManager.updateCurrentTrackDisplay();
      }
    }
  }

  updatePlaylist(playlist) {
    this.playlist = playlist;
    this.app.uiManager.updatePlaylistDisplay();
  }

  playTrack(index) {
    const track = this.playlist[index];
    if (track) {
      this.app.audioManager.changeTrack(track);
      if (this.app.currentRoom) {
        this.app.socketManager.emit("changeTrack", {
          roomId: this.app.currentRoom,
          trackIndex: index,
        });
      }
      this.app.audioManager.playMusic();
    }
  }

  playNextTrack() {
    if (this.playlist.length > 0) {
      const currentIndex = this.playlist.findIndex(
        (track) => track.id === this.app.audioManager.currentTrack?.id
      );
      const nextIndex = (currentIndex + 1) % this.playlist.length;
      const nextTrack = this.playlist[nextIndex];

      if (nextTrack) {
        this.app.audioManager.changeTrack(nextTrack);
        if (this.app.audioManager.isPlaying) {
          this.app.audioManager.playMusic();
        }
      }
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}