import { useEffect, useRef, useCallback } from 'react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    seekToTime,
    setVolume,
    isController,
    hasControl
  } = useSyncBeatsStore();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = document.createElement('audio');
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      document.body.appendChild(audio);
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        document.body.removeChild(audioRef.current);
        audioRef.current = null;
      }
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
    }
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle time updates
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        if (isController) {
          seekToTime(audio.currentTime);
        }
      };

      const handleLoadedMetadata = () => {
        if (isController) {
          seekToTime(audio.currentTime);
        }
      };

      const handleDurationChange = () => {
        if (isController) {
          seekToTime(audio.currentTime);
        }
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('durationchange', handleDurationChange);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('durationchange', handleDurationChange);
      };
    }
  }, [isController, seekToTime]);

  // Handle seeking
  useEffect(() => {
    if (audioRef.current && !isController) {
      const audio = audioRef.current;
      const timeDiff = Math.abs(audio.currentTime - currentTime);
      
      // Only seek if the difference is significant (more than 1 second)
      if (timeDiff > 1) {
        audio.currentTime = currentTime;
      }
    }
  }, [currentTime, isController]);

  // Handle duration updates
  useEffect(() => {
    if (audioRef.current && audioRef.current.duration) {
      const audio = audioRef.current;
      if (isController) {
        seekToTime(audio.currentTime);
      }
    }
  }, [isController, seekToTime]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current && isController) {
      audioRef.current.currentTime = time;
    }
  }, [isController]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, [setVolume]);

  return {
    audioRef,
    handleSeek,
    handleVolumeChange,
    duration: audioRef.current?.duration || duration,
    currentTime: audioRef.current?.currentTime || currentTime,
    volume: audioRef.current?.volume || volume,
    isPlaying: !audioRef.current?.paused || isPlaying,
    isController,
    hasControl
  };
};
