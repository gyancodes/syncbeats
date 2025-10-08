import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Search, Plus, X } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export default function YouTubeSection() {
  const { searchYouTube, youtubeResults, addYouTubeTrack, isSearching, currentRoom } = useSyncBeatsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchYouTube(searchQuery.trim());
      setShowResults(true);
    }
  };

  const handleAddTrack = (videoId: string) => {
    if (!currentRoom) {
      return; // Guard: must join a room before adding
    }
    addYouTubeTrack(videoId);
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
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
          <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          YouTube Music
        </h2>
      </div>

      <div className="space-y-4">
        {!currentRoom && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-200">
            Join a room to add YouTube tracks to a shared playlist.
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for music on YouTube..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
          </div>
        )}

        {showResults && youtubeResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 max-h-64 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Results
              </h3>
              <button
                onClick={() => setShowResults(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {youtubeResults.map((video, index) => (
              <motion.div
                key={video.videoId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="youtube-item"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="youtube-thumbnail"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDuration(video.duration)}
                  </p>
                </div>
                <button
                  onClick={() => handleAddTrack(video.videoId)}
                  className="btn btn-primary flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!currentRoom}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {showResults && youtubeResults.length === 0 && !isSearching && (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400">
              No results found. Try a different search term.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}




