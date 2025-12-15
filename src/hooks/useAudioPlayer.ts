import { useEffect, useRef, useCallback } from 'react';
import { useSyncBeatsStore } from '../store/syncBeatsStore';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    seekToTime,
    syncPlaybackTime,
    updateCurrentTime,
    setVolume,
    isController,
    hasControl
  } = useSyncBeatsStore();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = document.createElement('audio');
      // Preload more aggressively for local files and avoid cross-origin requirements
      audio.preload = 'auto';
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
      // If already in playing state, attempt to play immediately on track change
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('Audio play error on track change:', err, 'src:', audioRef.current?.src);
        });
      }
    }
  }, [currentTrack, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Ensure volume is set before play
        audioRef.current.volume = volume;
        audioRef.current.play().catch((err) => {
          console.error('Audio play error:', err, 'src:', audioRef.current?.src);
        });
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

  // Handle time updates (Local UI update only)
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => {
        if (isController) {
          updateCurrentTime(audio.currentTime);
        }
      };

      const handleLoadedMetadata = () => {
        if (isController) {
          updateCurrentTime(audio.currentTime);
        }
      };

      const handleDurationChange = () => {
        if (isController) {
          updateCurrentTime(audio.currentTime);
        }
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('durationchange', handleDurationChange);

      const handleCanPlay = () => {
        // Auto-attempt play when the media becomes playable
        if (isPlaying) {
          audio.play().catch((err) => {
            console.error('Audio play error on canplay:', err, 'src:', audio.src);
          });
        }
      };

      const handleError = () => {
        console.error('Audio element error:', audio.error, 'src:', audio.src);
      };

      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('canplaythrough', handleCanPlay);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [isController, updateCurrentTime, isPlaying]);

  // Periodic Sync (Network Broadcast)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isController && isPlaying && audioRef.current) {
      interval = setInterval(() => {
        if (audioRef.current) {
          syncPlaybackTime(audioRef.current.currentTime);
        }
      }, 5000); // Sync every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isController, isPlaying, syncPlaybackTime]);

  // Handle seeking incoming from store (for listeners)
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

  // Handle duration updates for listeners? No, durations strictly from metadata usually.
  // ... existing code was just updating UI via re-renders.

  const handleSeek = useCallback((time: number) => {
    if (isController) {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      seekToTime(time); // Broadcast the seek event
    }
  }, [isController, seekToTime]);

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

