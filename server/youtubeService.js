const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function normalizeVideoId(value) {
  const candidate = (value || "").trim();
  return YOUTUBE_VIDEO_ID_REGEX.test(candidate) ? candidate : null;
}

function extractVideoId(input) {
  const trimmedInput = (input || "").trim();

  if (!trimmedInput) {
    return null;
  }

  const directVideoId = normalizeVideoId(trimmedInput);
  if (directVideoId) {
    return directVideoId;
  }

  try {
    const url = new URL(trimmedInput);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return normalizeVideoId(url.pathname.slice(1));
    }

    if (host.endsWith("youtube.com")) {
      const watchVideoId = normalizeVideoId(url.searchParams.get("v"));
      if (watchVideoId) {
        return watchVideoId;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      const routeIndex = segments.findIndex((segment) =>
        ["embed", "shorts", "live", "v"].includes(segment)
      );

      if (routeIndex >= 0) {
        return normalizeVideoId(segments[routeIndex + 1]);
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function getDirectVideoResult(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const oembedUrl = new URL("https://www.youtube.com/oembed");
    oembedUrl.searchParams.set("url", videoUrl);
    oembedUrl.searchParams.set("format", "json");

    const response = await fetch(oembedUrl.toString());

    if (!response.ok) {
      throw new Error(`YouTube oEmbed error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: videoId,
      title: data.title || "YouTube Video",
      channel: data.author_name || "YouTube",
      thumbnail:
        data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      url: videoUrl,
    };
  } catch (error) {
    console.error("Direct YouTube lookup error:", error);

    return {
      id: videoId,
      title: "YouTube Video",
      channel: "Direct Link",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      url: videoUrl,
    };
  }
}

/**
 * Search YouTube videos
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return
 * @returns {Promise<Array>} Array of video results
 */
async function searchVideos(query, maxResults = 10) {
  const directVideoId = extractVideoId(query);

  if (directVideoId) {
    return [await getDirectVideoResult(directVideoId)];
  }

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
