import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, MessageCircle, Send, Mail } from 'lucide-react';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';

export default function SharingModal() {
  const { showSharingModal, shareLink, hideSharing, copyShareLink } = useSyncBeatsStore();

  const shareOnWhatsApp = () => {
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareOnTelegram = () => {
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Join me on SyncBeats! 🎵';
    const body = `Hey! I'm listening to music on SyncBeats and would love for you to join!\n\nClick this link to join: ${shareLink}\n\nSee you there! 🎶`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <AnimatePresence>
      {showSharingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={hideSharing}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share Room</h2>
              </div>
              <button
                onClick={hideSharing}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="input-field flex-1 bg-gray-50 dark:bg-gray-700"
                  placeholder="Room link will appear here..."
                />
                <button
                  onClick={copyShareLink}
                  className="btn-secondary"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={shareOnWhatsApp}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share on WhatsApp
                </button>

                <button
                  onClick={shareOnTelegram}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Share on Telegram
                </button>

                <button
                  onClick={shareViaEmail}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Share via Email
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}