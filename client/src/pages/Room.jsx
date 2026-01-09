import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import MusicPlayer from "../components/MusicPlayer";
import TrackList from "../components/TrackList";
import UserList from "../components/UserList";
import YouTubeSearch from "../components/YouTubeSearch";
import YouTubePlayer from "../components/YouTubePlayer";
import { tracks } from "../data/tracks";
import "./Room.css";

function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [users, setUsers] = useState([]);
  const [activeSource, setActiveSource] = useState("youtube"); // 'local' or 'youtube'

  // Local tracks state
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // YouTube state
  const [currentVideo, setCurrentVideo] = useState(null);
  const [ytIsPlaying, setYtIsPlaying] = useState(false);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);

  const [copied, setCopied] = useState(false);
  const userName = location.state?.userName || "Anonymous";

  useEffect(() => {
    if (!socket || !location.state) {
      navigate("/");
      return;
    }

    if (location.state?.playbackState) {
      const {
        currentTrack: track,
        isPlaying: playing,
        currentTime: time,
        youtubeVideo,
        source,
      } = location.state.playbackState;
      if (track) {
        setCurrentTrack(track);
        setIsPlaying(playing);
        setCurrentTime(time);
      }
      if (youtubeVideo) {
        setCurrentVideo(youtubeVideo);
        setActiveSource("youtube");
      }
      if (source) {
        setActiveSource(source);
      }
    }

    socket.on("room:user-joined", ({ users: newUsers }) => {
      setUsers(newUsers);
    });

    socket.on("room:user-left", ({ users: newUsers }) => {
      setUsers(newUsers);
    });

    // Local track sync
    socket.on("sync:play", ({ currentTime: time }) => {
      setIsSyncing(true);
      setCurrentTime(time);
      setIsPlaying(true);
      setTimeout(() => setIsSyncing(false), 100);
    });

    socket.on("sync:pause", ({ currentTime: time }) => {
      setIsSyncing(true);
      setCurrentTime(time);
      setIsPlaying(false);
      setTimeout(() => setIsSyncing(false), 100);
    });

    socket.on("sync:seek", ({ currentTime: time }) => {
      setIsSyncing(true);
      setCurrentTime(time);
      setTimeout(() => setIsSyncing(false), 100);
    });

    socket.on("sync:track-change", ({ track }) => {
      setCurrentTrack(track);
      setCurrentTime(0);
      setIsPlaying(true);
      setActiveSource("local");
    });

    // YouTube sync
    socket.on("sync:youtube-play", ({ currentTime: time }) => {
      setYtCurrentTime(time);
      setYtIsPlaying(true);
    });

    socket.on("sync:youtube-pause", ({ currentTime: time }) => {
      setYtCurrentTime(time);
      setYtIsPlaying(false);
    });

    socket.on("sync:youtube-seek", ({ currentTime: time }) => {
      setYtCurrentTime(time);
    });

    socket.on("sync:youtube-change", ({ video }) => {
      setCurrentVideo(video);
      setYtCurrentTime(0);
      setYtIsPlaying(true);
      setActiveSource("youtube");
    });

    if (location.state?.isHost) {
      setUsers([{ id: socket.id, name: userName }]);
    }

    return () => {
      socket.off("room:user-joined");
      socket.off("room:user-left");
      socket.off("sync:play");
      socket.off("sync:pause");
      socket.off("sync:seek");
      socket.off("sync:track-change");
      socket.off("sync:youtube-play");
      socket.off("sync:youtube-pause");
      socket.off("sync:youtube-seek");
      socket.off("sync:youtube-change");
    };
  }, [socket, location.state, navigate, userName]);

  // Local track handlers
  const handlePlay = (time) => {
    setIsPlaying(true);
    setCurrentTime(time);
    socket?.emit("sync:play", { roomCode, currentTime: time });
  };

  const handlePause = (time) => {
    setIsPlaying(false);
    setCurrentTime(time);
    socket?.emit("sync:pause", { roomCode, currentTime: time });
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
    socket?.emit("sync:seek", { roomCode, currentTime: time });
  };

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
    setActiveSource("local");
    socket?.emit("sync:track-change", { roomCode, track });
  };

  // YouTube handlers
  const handleYtPlay = (time) => {
    setYtIsPlaying(true);
    setYtCurrentTime(time);
    socket?.emit("sync:youtube-play", { roomCode, currentTime: time });
  };

  const handleYtPause = (time) => {
    setYtIsPlaying(false);
    setYtCurrentTime(time);
    socket?.emit("sync:youtube-pause", { roomCode, currentTime: time });
  };

  const handleYtSeek = (time) => {
    setYtCurrentTime(time);
    socket?.emit("sync:youtube-seek", { roomCode, currentTime: time });
  };

  const handleVideoSelect = (video) => {
    setCurrentVideo(video);
    setYtCurrentTime(0);
    setYtIsPlaying(true);
    setActiveSource("youtube");
    socket?.emit("sync:youtube-change", { roomCode, video });
  };

  const handleLeaveRoom = () => {
    socket?.emit("room:leave");
    navigate("/");
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="room-page">
      <header className="room-header">
        <div className="room-info">
          <h2>SYNCBEATS</h2>
          <div className="room-code-display" onClick={copyRoomCode}>
            <span className="room-label">Room</span>
            <span className="room-code">{roomCode}</span>
            <span className="copy-icon">{copied ? "OK" : "CP"}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className={`connection-badge ${isConnected ? "connected" : ""}`}>
            <span className="status-dot"></span>
            {isConnected ? "Live" : "Reconnecting"}
          </div>
          <button className="btn btn-secondary" onClick={handleLeaveRoom}>
            Leave
          </button>
        </div>
      </header>

      <main className="room-main">
        <aside className="room-sidebar left">
          <div className="source-tabs">
            <button
              className={`source-tab ${
                activeSource === "youtube" ? "active" : ""
              }`}
              onClick={() => setActiveSource("youtube")}
            >
              YouTube
            </button>
            <button
              className={`source-tab ${
                activeSource === "local" ? "active" : ""
              }`}
              onClick={() => setActiveSource("local")}
            >
              Local
            </button>
          </div>

          {activeSource === "youtube" ? (
            <YouTubeSearch
              onVideoSelect={handleVideoSelect}
              currentVideo={currentVideo}
            />
          ) : (
            <TrackList
              tracks={tracks}
              currentTrack={currentTrack}
              onTrackSelect={handleTrackSelect}
            />
          )}
        </aside>

        <section className="room-center">
          {activeSource === "youtube" ? (
            <YouTubePlayer
              video={currentVideo}
              isPlaying={ytIsPlaying}
              currentTime={ytCurrentTime}
              onPlay={handleYtPlay}
              onPause={handleYtPause}
              onSeek={handleYtSeek}
            />
          ) : (
            <MusicPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              isSyncing={isSyncing}
            />
          )}

          <div className="sync-indicator">
            <span className="sync-icon">*</span>
            <span>Synced playback across all listeners</span>
          </div>
        </section>

        <aside className="room-sidebar right">
          <UserList users={users} currentUserId={socket?.id} />
        </aside>
      </main>
    </div>
  );
}

export default Room;
