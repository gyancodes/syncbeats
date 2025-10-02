import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, SkipForward, SkipBack } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMusic,
    pauseMusic,
    setVolume,
    seekToTime,
    isController,
    hasControl
  } = useSyncBeatsStore();

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    seekToTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="player-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
          <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Music Player
        </h2>
      </div>

      {!currentTrack ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No track selected. Join a room and add music to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Track Info */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {currentTrack.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentTrack.type === 'youtube' ? 'YouTube Video' : 'Uploaded File'}
            </p>
          </div>

          {/* Control Status */}
          {hasControl && (
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isController 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
              }`}>
                {isController ? 'You have control' : 'Requesting control...'}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <SkipBack className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={isPlaying ? pauseMusic : playMusic}
              disabled={!isController && hasControl}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            
            <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <SkipForward className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

