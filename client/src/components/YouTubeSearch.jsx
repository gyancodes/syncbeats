import { useState } from "react";
import "./YouTubeSearch.css";

const API_URL = import.meta.env.VITE_SERVER_URL || "";

function YouTubeSearch({ onVideoSelect, currentVideo }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="youtube-search">
      <h3 className="search-title">YouTube Search</h3>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="input search-input"
          placeholder="Search for music..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary search-btn"
          disabled={isLoading}
        >
          {isLoading ? "..." : "Search"}
        </button>
      </form>

      <div className="search-results">
        {isLoading && <div className="search-loading">Searching...</div>}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="search-empty">No results found</div>
        )}

        {!isLoading &&
          results.map((video) => (
            <div
              key={video.id}
              className={`video-item ${
                currentVideo?.id === video.id ? "active" : ""
              }`}
              onClick={() => onVideoSelect(video)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="video-thumbnail"
              />
              <div className="video-info">
                <span className="video-title">{video.title}</span>
                <span className="video-channel">{video.channel}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default YouTubeSearch;
