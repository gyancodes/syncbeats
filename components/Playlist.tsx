'use client';

import { motion } from 'framer-motion';
import { List, Play, Music, Trash2 } from 'lucide-react';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';

export default function Playlist() {
  const { playlist, currentTrack, playTrack, removeTrack } = useSyncBeatsStore();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-header">
        <div className="card-icon">
          <List className="w-5 h-5" />
        </div>
        <h2 className="card-title">Playlist</h2>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {playlist.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No tracks in playlist yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  track.id === currentTrack?.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {track.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {track.type === 'youtube' ? (
                      <span className="flex items-center gap-1">
                        <span>YouTube Video</span>
                        {track.duration && <span>• {formatTime(track.duration)}</span>}
                      </span>
                    ) : (
                      formatFileSize(track.size)
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => playTrack(index)}
                    className="btn-primary p-2"
                    title="Play track"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="btn-danger p-2"
                    title="Remove track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}