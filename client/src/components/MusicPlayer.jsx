import { useRef, useState, useEffect } from "react";
import "./MusicPlayer.css";

function MusicPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  isSyncing,
}) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  // Sync playback state
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Sync time when receiving external seek
  useEffect(() => {
    if (!audioRef.current || isSyncing) return;

    const diff = Math.abs(audioRef.current.currentTime - currentTime);
    if (diff > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isSyncing]);

  // Load new track
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.src = currentTrack.url;
    audioRef.current.load();

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrack?.id]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setLocalTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    audioRef.current.currentTime = newTime;
    onSeek(newTime);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause(localTime);
    } else {
      onPlay(localTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (localTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <div className="music-player empty">
        <div className="empty-state">
          <span className="empty-icon">🎵</span>
          <p>Select a track to start listening</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onPause(0)}
      />

      {/* Track Info */}
      <div className="player-track-info">
        <div className="player-cover">
          <span className={isPlaying ? "animate-pulse" : ""}>
            {currentTrack.cover}
          </span>
        </div>
        <div className="player-details">
          <h4 className="player-title">{currentTrack.title}</h4>
          <p className="player-artist">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="player-progress-container">
        <span className="time-display">{formatTime(localTime)}</span>
        <div
          ref={progressRef}
          className="player-progress"
          onClick={handleProgressClick}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <div className="progress-handle" style={{ left: `${progress}%` }} />
        </div>
        <span className="time-display">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="player-controls">
        <button
          className="btn btn-icon control-btn"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, localTime - 10);
              onSeek(audioRef.current.currentTime);
            }
          }}
          title="Rewind 10s"
        >
          ⏪
        </button>

        <button
          className="btn btn-icon btn-icon-lg control-btn play-btn"
          onClick={handlePlayPause}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>

        <button
          className="btn btn-icon control-btn"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(duration, localTime + 10);
              onSeek(audioRef.current.currentTime);
            }
          }}
          title="Forward 10s"
        >
          ⏩
        </button>
      </div>

      {/* Volume */}
      <div className="player-volume">
        <button
          className="btn btn-icon volume-btn"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            setIsMuted(false);
          }}
          className="volume-slider"
        />
      </div>
    </div>
  );
}

export default MusicPlayer;
