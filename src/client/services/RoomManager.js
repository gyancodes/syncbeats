// Room Management and State Synchronization
export class RoomManager {
  constructor(app) {
    this.app = app;
  }

  joinRoom(roomId) {
    if (!roomId) {
      alert("Please enter a room ID");
      return;
    }

    this.app.socketManager.emit("joinRoom", roomId);
  }

  leaveRoom() {
    if (this.app.currentRoom) {
      this.app.socketManager.emit("leaveRoom", this.app.currentRoom);
      this.app.currentRoom = null;
      this.app.uiManager.hidePlayerSection();
      this.app.uiManager.hidePlaylistSection();
      this.app.uiManager.updateRoomStatus(null);
      this.app.audioManager.stopMusic();
    }
  }

  handleRoomJoined(roomId) {
    this.app.currentRoom = roomId;
    this.app.uiManager.updateRoomStatus(roomId);
    this.app.uiManager.showPlayerSection();
    this.app.uiManager.showPlaylistSection();
  }

  async updateRoomState(roomState) {
    console.log("Updating room state:", roomState);
    
    this.app.playlistManager.playlist = roomState.playlist || [];
    this.app.audioManager.isPlaying = roomState.isPlaying;
    this.app.audioManager.audio.volume = roomState.volume || 1;

    // Update control status
    this.app.isController = roomState.controller === this.app.socketManager.socket.id;
    this.app.hasControl = roomState.controller !== null;

    this.app.uiManager.updatePlaylistDisplay();
    this.app.uiManager.updateVolumeDisplay();
    
    // Update control status UI
    this.app.uiManager.updateControlStatus({
      controller: roomState.controller,
      isYou: this.app.isController
    });

    // Handle current track change
    if (roomState.currentTrack && 
        (!this.app.audioManager.currentTrack || 
         this.app.audioManager.currentTrack.id !== roomState.currentTrack.id)) {
      console.log("Room has different current track, changing to:", roomState.currentTrack.name);
      await this.app.audioManager.changeTrack(roomState.currentTrack);
    } else if (this.app.audioManager.currentTrack) {
      this.app.uiManager.updateCurrentTrackDisplay();
    }

    // Sync playback state
    if (roomState.isPlaying && !this.app.audioManager.isPlaying && this.app.audioManager.currentTrack) {
      console.log("Room is playing, starting local playback");
      await this.app.audioManager.playMusicLocal(roomState.currentTime);
    } else if (!roomState.isPlaying && this.app.audioManager.isPlaying) {
      console.log("Room is paused, pausing local playback");
      this.app.audioManager.pauseMusicLocal();
    }
  }
}