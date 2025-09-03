'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Search, Plus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';

export default function YouTubeSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    currentRoom,
    youtubeResults,
    isSearching,
    searchYouTube,
    addYouTubeTrack,
  } = useSyncBeatsStore();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchYouTube(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-header">
        <div className="card-icon bg-gradient-to-r from-red-600 to-red-700">
          <Youtube className="w-5 h-5" />
        </div>
        <h2 className="card-title">YouTube</h2>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search YouTube videos..."
            className="input-field flex-1"
            disabled={isSearching || !currentRoom}
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching || !currentRoom}
            className="btn-primary"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {!currentRoom && (
          <p className="text-sm text-amber-600 dark:text-amber-400">Join a room to search YouTube</p>
        )}

        {youtubeResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-h-80 overflow-y-auto space-y-3"
          >
            {youtubeResults.map((video, index) => (
              <motion.div
                key={video.videoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
              >
                <div className="relative w-20 h-15 flex-shrink-0">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover rounded"
                    sizes="80px"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDuration(video.duration)}
                  </p>
                </div>

                <button
                  onClick={() => addYouTubeTrack(video.videoId)}
                  className="btn-primary p-2 flex-shrink-0"
                  title="Add to playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}