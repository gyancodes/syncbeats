const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

/**
 * Search YouTube videos
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return
 * @returns {Promise<Array>} Array of video results
 */
async function searchVideos(query, maxResults = 10) {
  if (!YOUTUBE_API_KEY) {
    // Return mock data if no API key
    return getMockResults(query);
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoCategoryId", "10"); // Music category
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", maxResults.toString());
    url.searchParams.set("key", YOUTUBE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    return data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error("YouTube search error:", error);
    return getMockResults(query);
  }
}

/**
 * Get mock results when no API key is set
 */
function getMockResults(query) {
  const mockVideos = [
    {
      id: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      channel: "Rick Astley",
    },
    { id: "jNQXAC9IVRw", title: "Me at the zoo", channel: "jawed" },
    { id: "9bZkp7q19f0", title: "Gangnam Style", channel: "officialpsy" },
    { id: "kJQP7kiw5Fk", title: "Despacito", channel: "Luis Fonsi" },
    { id: "RgKAFK5djSk", title: "See You Again", channel: "Wiz Khalifa" },
    {
      id: "fJ9rUzIMcZQ",
      title: "Bohemian Rhapsody",
      channel: "Queen Official",
    },
    { id: "hTWKbfoikeg", title: "Smells Like Teen Spirit", channel: "Nirvana" },
    { id: "YQHsXMglC9A", title: "Hello", channel: "Adele" },
  ];

  return mockVideos
    .filter(
      (v) =>
        v.title.toLowerCase().includes(query.toLowerCase()) ||
        v.channel.toLowerCase().includes(query.toLowerCase()) ||
        query.length < 3
    )
    .slice(0, 5)
    .map((v) => ({
      ...v,
      thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
      publishedAt: new Date().toISOString(),
    }));
}

module.exports = { searchVideos };
