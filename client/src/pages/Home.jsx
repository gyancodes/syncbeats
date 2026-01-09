import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "./Home.css";

function Home() {
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!socket || !isConnected) {
      setError("Not connected to server");
      return;
    }

    socket.emit("room:create", { userName: userName.trim() }, (response) => {
      if (response.success) {
        navigate(`/room/${response.roomCode}`, {
          state: { userName: userName.trim(), isHost: true },
        });
      } else {
        setError(response.error || "Failed to create room");
      }
    });
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    if (!socket || !isConnected) {
      setError("Not connected to server");
      return;
    }

    socket.emit(
      "room:join",
      {
        userName: userName.trim(),
        roomCode: roomCode.trim().toUpperCase(),
      },
      (response) => {
        if (response.success) {
          navigate(`/room/${response.roomCode}`, {
            state: {
              userName: userName.trim(),
              isHost: false,
              playbackState: response.playbackState,
            },
          });
        } else {
          setError(response.error || "Failed to join room");
        }
      }
    );
  };

  return (
    <div className="home-page">
      <div className="home-content">
        {/* Hero Section */}
        <div className="hero animate-fadeIn">
          <div className="logo-container">
            <div className="logo">
              <span className="logo-icon">S</span>
            </div>
          </div>
          <h1>SYNCBEATS</h1>
          <p className="tagline">Listen Together</p>
        </div>

        {/* Connection Status */}
        <div className={`connection-status ${isConnected ? "connected" : ""}`}>
          <span className="status-dot"></span>
          {isConnected ? "Connected" : "Connecting..."}
        </div>

        {/* Main Card */}
        <div className="home-card animate-fadeIn">
          {/* Name Input */}
          <div className="input-group">
            <label htmlFor="userName">Your Name</label>
            <input
              id="userName"
              type="text"
              className="input"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError("");
              }}
              maxLength={20}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Toggle Join/Create */}
          <div className="mode-toggle">
            <button
              className={`toggle-btn ${!isJoining ? "active" : ""}`}
              onClick={() => setIsJoining(false)}
            >
              Create Room
            </button>
            <button
              className={`toggle-btn ${isJoining ? "active" : ""}`}
              onClick={() => setIsJoining(true)}
            >
              Join Room
            </button>
          </div>

          {isJoining ? (
            <div className="action-section">
              <div className="input-group">
                <label htmlFor="roomCode">Room Code</label>
                <input
                  id="roomCode"
                  type="text"
                  className="input room-code-input"
                  placeholder="------"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  maxLength={6}
                />
              </div>
              <button
                className="btn btn-primary action-btn"
                onClick={handleJoinRoom}
                disabled={!isConnected}
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="action-section">
              <p className="action-description">
                Create a room and share the code with friends.
              </p>
              <button
                className="btn btn-primary action-btn"
                onClick={handleCreateRoom}
                disabled={!isConnected}
              >
                Create Room
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="features animate-fadeIn">
          <div className="feature">
            <div className="feature-icon">S</div>
            <span>Sync</span>
          </div>
          <div className="feature">
            <div className="feature-icon">Y</div>
            <span>YouTube</span>
          </div>
          <div className="feature">
            <div className="feature-icon">L</div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
