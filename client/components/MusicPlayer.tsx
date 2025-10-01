import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Crown, Hand, PlayCircle, Users } from 'lucide-react';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentRoom,
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    isController,
    hasControl,
    playMusic,
    setVolume,
    seekTo,
    requestControl,
  } = useSyncBeatsStore();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTime]);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    seekTo(newTime);
  };

  const getControlStatus = () => {
    if (isController) {
      return {
        icon: Crown,
        text: 'You have control',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
      };
    } else if (hasControl) {
      return {
        icon: Hand,
        text: 'Request control',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
        onClick: requestControl,
      };
    } else {
      return {
        icon: PlayCircle,
        text: 'Ready to play',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      };
    }
  };

  if (!currentRoom) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Room Joined</h3>
          <p className="text-gray-600 dark:text-gray-400">Join a room to start listening to music together!</p>
        </div>
      </motion.div>
    );
  }

  const controlStatus = getControlStatus();
  const StatusIcon = controlStatus.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl shadow-lg border border-blue-500/20 p-6 text-white"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Play className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold">Music Player</h2>
      </div>

      <audio ref={audioRef} />

      {/* Current Track */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 text-center">
        <div className="text-lg font-semibold mb-1">
          {currentTrack ? currentTrack.name : 'No track selected'}
        </div>
        <div className="text-sm opacity-80">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      {currentTrack && (
        <div className="mb-6">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Playback */}
        <div className="text-center">
          <div className="text-xs opacity-80 mb-2 uppercase tracking-wide">Playback</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => playMusic()}
              disabled={!currentTrack || (!isController && hasControl)}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Volume */}
        <div className="text-center">
          <div className="text-xs opacity-80 mb-2 uppercase tracking-wide">Volume</div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="text-xs mt-1">{Math.round(volume * 100)}%</div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="text-xs opacity-80 mb-2 uppercase tracking-wide">Status</div>
          <div
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${controlStatus.className}`}
            onClick={controlStatus.onClick}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{controlStatus.text}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}