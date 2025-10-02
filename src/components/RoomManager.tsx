import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Hash, LogIn, LogOut } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export default function RoomManager() {
  const { currentRoom, joinRoom, leaveRoom, userCount } = useSyncBeatsStore();
  const [roomId, setRoomId] = useState('');

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      joinRoom(roomId.trim());
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setRoomId('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="room-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Room Management
        </h2>
      </div>

      {!currentRoom ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              <button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                Join
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Current Room
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Room ID: {currentRoom}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{userCount} users</span>
            </div>
          </div>
          
          <button
            onClick={handleLeaveRoom}
            className="btn btn-danger flex items-center gap-2 w-full"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </button>
        </div>
      )}
    </motion.div>
  );
}

