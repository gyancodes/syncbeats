'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import RoomManager from '@/components/RoomManager';
import MusicPlayer from '@/components/MusicPlayer';
import Playlist from '@/components/Playlist';
import UploadSection from '@/components/UploadSection';
import YouTubeSection from '@/components/YouTubeSection';
import SharingModal from '@/components/SharingModal';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';

export default function Home() {
  const { initializeSocket, currentRoom } = useSyncBeatsStore();

  useEffect(() => {
    initializeSocket();
  }, [initializeSocket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Column */}
          <div className="space-y-8">
            <RoomManager />
            <UploadSection />
            <YouTubeSection />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <MusicPlayer />
            {currentRoom && <Playlist />}
          </div>
        </motion.div>
      </main>

      <SharingModal />
    </div>
  );
}