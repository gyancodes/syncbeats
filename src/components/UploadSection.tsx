import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileAudio, X } from 'lucide-react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export default function UploadSection() {
  const { uploadFile, isUploading } = useSyncBeatsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
          uploadFile(file);
        }
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="room-card"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
          <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Upload Music
        </h2>
      </div>

      <div
        className={`upload-area ${dragActive ? 'dragover' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FileAudio className="w-8 h-8 text-gray-400" />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop audio files here
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports MP3, WAV, M4A, and other audio formats
            </p>
          </div>

          <button className="btn btn-primary">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Uploading files...
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

