import React from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Trash2, ExternalLink } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export default function Playlist() {
  const { playlist, currentTrack, playTrack, removeTrack } = useSyncBeatsStore();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="room-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
          <Music className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Playlist
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ({playlist.length} tracks)
        </span>
      </div>

      {playlist.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No tracks in playlist yet. Upload music or add from YouTube.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {playlist.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`playlist-item ${
                currentTrack?.id === track.id ? 'current' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {track.type === 'youtube' && track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt={track.name}
                    className="w-12 h-9 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-9 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Music className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {track.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {track.type === 'youtube' ? 'YouTube Video' : formatFileSize(track.size || 0)}
                    </span>
                    {track.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(track.duration)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => playTrack(index)}
                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                  title="Play track"
                >
                  <Play className="w-4 h-4" />
                </button>
                
                {track.type === 'youtube' && (
                  <a
                    href={`https://youtube.com/watch?v=${track.id.replace('yt_', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
                    title="Open in YouTube"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                
                <button
                  onClick={() => removeTrack(track.id)}
                  className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                  title="Remove track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}




