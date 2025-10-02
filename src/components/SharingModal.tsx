import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, X, MessageCircle, Send, Mail } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export default function SharingModal() {
  const { currentRoom, shareLink, showSharingModal, hideSharingModal, copyShareLink } = useSyncBeatsStore();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    copyShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareOnTelegram = () => {
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Join me on SyncBeats! 🎵';
    const body = `Hey! I'm listening to music on SyncBeats and would love for you to join!\n\nClick this link to join: ${shareLink}\n\nSee you there! 🎶`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  if (!showSharingModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={hideSharingModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Share Room
              </h2>
            </div>
            <button
              onClick={hideSharingModal}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={`btn ${copied ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Share via
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={shareOnWhatsApp}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-800 dark:text-green-200">
                    WhatsApp
                  </span>
                </button>

                <button
                  onClick={shareOnTelegram}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Telegram
                  </span>
                </button>

                <button
                  onClick={shareViaEmail}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Mail className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    Email
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Share this link with friends to let them join your music room!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

