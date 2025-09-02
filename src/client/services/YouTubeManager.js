// YouTube Integration Management
export class YouTubeManager {
  constructor(app) {
    this.app = app;
  }

  searchYouTube() {
    const query = document.getElementById("youtubeSearch").value.trim();
    if (!query) {
      alert("Please enter a search term");
      return;
    }

    if (!this.app.currentRoom) {
      alert("Please join a room first");
      return;
    }

    this.app.socketManager.emit("searchYouTube", { 
      query, 
      roomId: this.app.currentRoom 
    });
    document.getElementById("youtubeResults").classList.remove("hidden");
  }

  displayYouTubeResults(results) {
    const resultsList = document.getElementById("youtubeResultsList");

    if (results.length === 0) {
      resultsList.innerHTML = '<div class="text-center text-muted">No results found</div>';
      return;
    }

    resultsList.innerHTML = results
      .map((video) => `
        <div class="youtube-item">
          <img src="${video.thumbnail}" alt="${video.title}" class="youtube-thumbnail">
          <div class="youtube-info">
            <div class="youtube-title">${video.title}</div>
            <div class="youtube-duration">${this.app.uiManager.formatTime(video.duration)}</div>
          </div>
          <button class="btn btn-primary" onclick="syncBeats.addYouTubeTrack('${video.videoId}')" style="padding: 0.5rem;">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      `)
      .join("");
  }

  addYouTubeTrack(videoId) {
    if (!this.app.currentRoom) {
      alert("Please join a room first");
      return;
    }

    this.app.socketManager.emit("addYouTubeTrack", { 
      videoId, 
      roomId: this.app.currentRoom 
    });
  }

  async refreshYouTubeUrl(track) {
    try {
      const videoId = track.id.replace("yt_", "");
      const response = await fetch(`/api/youtube/${videoId}`);
      const data = await response.json();

      if (data.url) {
        track.url = data.url;
        this.app.audioManager.audio.src = data.url;
        this.app.audioManager.audio.load();
        console.log("YouTube URL refreshed successfully");
      } else {
        throw new Error(data.error || "Failed to refresh URL");
      }
    } catch (error) {
      console.error("Failed to refresh YouTube URL:", error);
      alert("Failed to play YouTube track. The video might be unavailable or restricted.");
    }
  }
}