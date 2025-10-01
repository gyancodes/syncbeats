import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, LogIn, LogOut, Share2 } from 'lucide-react';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';

export default function RoomManager() {
  const [roomId, setRoomId] = useState('');
  const {
    currentRoom,
    userCount,
    playlist,
    joinRoom,
    leaveRoom,
    showSharing,
  } = useSyncBeatsStore();

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      joinRoom(roomId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-header">
        <div className="card-icon">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="card-title">Room Management</h2>
      </div>

      {!currentRoom ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter room ID (e.g., party123)"
              className="input-field"
            />
          </div>
          <button
            onClick={handleJoinRoom}
            disabled={!roomId.trim()}
            className="btn-primary w-full"
          >
            <LogIn className="w-4 h-4" />
            Join Room
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">Room: {currentRoom}</span>
              </div>
              <button
                onClick={showSharing}
                className="btn-secondary"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userCount}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Users</div>
              </div>
              <div className="text-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{playlist.length}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Tracks</div>
              </div>
            </div>
          </div>

          <button
            onClick={leaveRoom}
            className="btn-danger w-full"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </button>
        </div>
      )}
    </motion.div>
  );
}