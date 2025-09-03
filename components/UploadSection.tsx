'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { CloudUpload, FolderOpen } from 'lucide-react';
import { useSyncBeatsStore } from '@/store/syncBeatsStore';
import toast from 'react-hot-toast';

export default function UploadSection() {
  const { currentRoom, isUploading, uploadProgress, uploadFile } = useSyncBeatsStore();

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    if (!currentRoom) {
      toast.error('Please join a room first');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/')) {
        uploadFile(file);
      } else {
        toast.error(`${file.name} is not an audio file`);
      }
    });
  }, [currentRoom, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-header">
        <div className="card-icon">
          <CloudUpload className="w-5 h-5" />
        </div>
        <h2 className="card-title">Upload Music</h2>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer"
      >
        <CloudUpload className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Drop files here</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">or click to browse</p>
        
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          id="file-upload"
          disabled={isUploading || !currentRoom}
        />
        
        <label
          htmlFor="file-upload"
          className={`btn-primary ${(!currentRoom || isUploading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FolderOpen className="w-4 h-4" />
          Choose Files
        </label>

        {!currentRoom && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">Join a room to upload files</p>
        )}
      </div>

      {isUploading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          <div className="text-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}