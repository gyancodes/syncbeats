import { useEffect, useRef, useState } from "react";
import "./YouTubePlayer.css";

function YouTubePlayer({
  video,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onReady,
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [duration, setDuration] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(tag, firstScript);
  }, []);

  // Create player when video changes
  useEffect(() => {
    if (!video) return;

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: video.id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
        },
        events: {
          onReady: (e) => {
            setPlayer(e.target);
            setDuration(e.target.getDuration());
            setIsReady(true);
            onReady?.();
          },
          onStateChange: (e) => {
            // YT.PlayerState: PLAYING=1, PAUSED=2
            if (e.data === 1) {
              setDuration(e.target.getDuration());
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [video?.id]);

  // Sync playback state
  useEffect(() => {
    if (!player || !isReady) return;

    try {
      if (isPlaying) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch (e) {
      console.error("Player control error:", e);
    }
  }, [isPlaying, player, isReady]);

  // Sync time
  useEffect(() => {
    if (!player || !isReady) return;

    try {
      const playerTime = player.getCurrentTime();
      if (Math.abs(playerTime - currentTime) > 2) {
        player.seekTo(currentTime, true);
      }
    } catch (e) {
      console.error("Seek error:", e);
    }
  }, [currentTime, player, isReady]);

  // Update local time
  useEffect(() => {
    if (!player || !isReady) return;

    const interval = setInterval(() => {
      try {
        const time = player.getCurrentTime();
        setLocalTime(time);
      } catch (e) {
        // Player not ready
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player, isReady]);

  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    player?.seekTo(newTime, true);
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

  if (!video) {
    return (
      <div className="youtube-player empty">
        <div className="empty-state">
          <span className="empty-icon">YT</span>
          <p>Search and select a video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-player">
      <div className="player-video-container">
        <div ref={containerRef} className="player-iframe"></div>
        <div className="player-overlay" onClick={handlePlayPause}>
          {!isPlaying && <div className="play-overlay-icon">&gt;</div>}
        </div>
      </div>

      <div className="player-info">
        <h4 className="player-title">{video.title}</h4>
        <p className="player-channel">{video.channel}</p>
      </div>

      <div className="player-progress-container">
        <span className="time-display">{formatTime(localTime)}</span>
        <div className="player-progress" onClick={handleProgressClick}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="time-display">{formatTime(duration)}</span>
      </div>

      <div className="player-controls">
        <button
          className="btn btn-icon control-btn"
          onClick={() => {
            const newTime = Math.max(0, localTime - 10);
            player?.seekTo(newTime, true);
            onSeek(newTime);
          }}
        >
          &lt;&lt;
        </button>
        <button
          className="btn btn-icon btn-icon-lg control-btn play-btn"
          onClick={handlePlayPause}
        >
          {isPlaying ? "||" : ">"}
        </button>
        <button
          className="btn btn-icon control-btn"
          onClick={() => {
            const newTime = Math.min(duration, localTime + 10);
            player?.seekTo(newTime, true);
            onSeek(newTime);
          }}
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  );
}

export default YouTubePlayer;
