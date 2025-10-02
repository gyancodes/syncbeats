import React from 'react';
import { motion } from 'framer-motion';
import { Music, Wifi, WifiOff } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { isConnected } = useSyncBeatsStore();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SyncBeats
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Synchronized Music Listening
              </p>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </motion.div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

