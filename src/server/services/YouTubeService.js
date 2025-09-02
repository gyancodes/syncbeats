// YouTube Integration Service
const ytdl = require("@distube/ytdl-core");
const ytSearch = require("yt-search");

class YouTubeService {
  async searchVideos(query) {
    try {
      const results = await ytSearch(query);
      return results.videos.slice(0, 10);
    } catch (error) {
      console.error("YouTube search error:", error);
      throw new Error("Search failed");
    }
  }

  async createTrackFromVideo(videoId) {
    try {
      const videoInfo = await ytdl.getInfo(videoId);

      // Get the best audio format
      const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
      const bestAudio = audioFormats.find((format) => format.container === "mp4") || audioFormats[0];

      if (!bestAudio) {
        throw new Error("No audio format available");
      }

      return {
        id: `yt_${videoId}`,
        name: videoInfo.videoDetails.title,
        url: bestAudio.url,
        type: "youtube",
        duration: parseInt(videoInfo.videoDetails.lengthSeconds),
        thumbnail: videoInfo.videoDetails.thumbnails[0]?.url,
        size: "YouTube Video",
      };
    } catch (error) {
      console.error("YouTube track creation error:", error);
      throw new Error("Failed to create YouTube track");
    }
  }

  async getStreamUrl(videoId) {
    try {
      const videoInfo = await ytdl.getInfo(videoId);

      // Get the best audio format
      const audioFormats = ytdl.filterFormats(videoInfo.formats, "audioonly");
      const bestAudio = audioFormats.find((format) => format.container === "mp4") || audioFormats[0];

      if (!bestAudio) {
        throw new Error("No audio format available");
      }

      return {
        url: bestAudio.url,
        title: videoInfo.videoDetails.title,
        duration: parseInt(videoInfo.videoDetails.lengthSeconds),
      };
    } catch (error) {
      console.error("YouTube stream error:", error);
      throw new Error("Failed to get YouTube stream");
    }
  }
}

module.exports = { YouTubeService };