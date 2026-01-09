import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import MusicPlayer from "../components/MusicPlayer";
import TrackList from "../components/TrackList";
import UserList from "../components/UserList";
import { tracks } from "../data/tracks";
import "./Room.css";

function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [users, setUsers] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const userName = location.state?.userName || "Anonymous";

  useEffect(() => {
    if (!socket || !location.state) {
      // Redirect to home if no state (direct URL access)
      navigate("/");
      return;
    }

    // Get initial state if joining existing room
    if (location.state?.playbackState) {
      const {
        currentTrack: track,
        isPlaying: playing,
        currentTime: time,
      } = location.state.playbackState;
      if (track) {
        setCurrentTrack(track);
        setIsPlaying(playing);
        setCurrentTime(time);
      }
    }

    // Listen for user events
    socket.on("room:user-joined", ({ users: newUsers }) => {
      setUsers(newUsers);
    });

    socket.on("room:user-left", ({ users: newUsers }) => {
      setUsers(newUsers);
    });

    // Listen for sync events
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
    });

    // Get initial users
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
    };
  }, [socket, location.state, navigate, userName]);

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
    socket?.emit("sync:track-change", { roomCode, track });
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
      {/* Header */}
      <header className="room-header glass">
        <div className="room-info">
          <h2 className="gradient-text">SyncBeats</h2>
          <div className="room-code-display" onClick={copyRoomCode}>
            <span className="room-label">Room Code:</span>
            <span className="room-code">{roomCode}</span>
            <span className="copy-icon">{copied ? "✓" : "📋"}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className={`connection-badge ${isConnected ? "connected" : ""}`}>
            <span className="status-dot"></span>
            {isConnected ? "Connected" : "Reconnecting..."}
          </div>
          <button className="btn btn-secondary" onClick={handleLeaveRoom}>
            Leave Room
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="room-main">
        {/* Left Panel - Track List */}
        <aside className="room-sidebar left glass">
          <TrackList
            tracks={tracks}
            currentTrack={currentTrack}
            onTrackSelect={handleTrackSelect}
          />
        </aside>

        {/* Center - Player */}
        <section className="room-center">
          <MusicPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            isSyncing={isSyncing}
          />

          {/* Sync indicator */}
          <div className="sync-indicator">
            <span className="sync-icon">🔄</span>
            <span>Everyone hears the same music in real-time</span>
          </div>
        </section>

        {/* Right Panel - Users */}
        <aside className="room-sidebar right glass">
          <UserList users={users} currentUserId={socket?.id} />
        </aside>
      </main>
    </div>
  );
}

export default Room;
