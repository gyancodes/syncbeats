import "./TrackList.css";

function TrackList({ tracks, currentTrack, onTrackSelect }) {
  return (
    <div className="track-list">
      <h3 className="track-list-title">Local Tracks</h3>
      <div className="tracks-container">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`track-item ${
              currentTrack?.id === track.id ? "active" : ""
            }`}
            onClick={() => onTrackSelect(track)}
          >
            <div className="track-cover">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="track-info">
              <span className="track-title">{track.title}</span>
              <span className="track-artist">{track.artist}</span>
            </div>
            <span className="track-duration">{track.duration}</span>
            {currentTrack?.id === track.id && (
              <div className="now-playing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackList;
