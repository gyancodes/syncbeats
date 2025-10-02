import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface Track {
  id: string;
  name: string;
  url: string;
  size?: number;
  type: string;
  duration?: number;
  thumbnail?: string;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
}

interface SyncBeatsState {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  
  // Room
  currentRoom: string | null;
  userCount: number;
  
  // Audio
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  
  // Control
  isController: boolean;
  hasControl: boolean;
  
  // Playlist
  playlist: Track[];
  
  // YouTube
  youtubeResults: YouTubeVideo[];
  isSearching: boolean;
  
  // Upload
  isUploading: boolean;
  
  // Sharing
  shareLink: string;
  showSharingModal: boolean;
  
  // Actions
  initializeSocket: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
  setVolume: (volume: number) => void;
  seekToTime: (time: number) => void;
  playTrack: (index: number) => void;
  removeTrack: (trackId: string) => void;
  uploadFile: (file: File) => void;
  searchYouTube: (query: string) => void;
  addYouTubeTrack: (videoId: string) => void;
  copyShareLink: () => void;
  hideSharingModal: () => void;
}

export const useSyncBeatsStore = create<SyncBeatsState>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  currentRoom: null,
  userCount: 0,
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isController: false,
  hasControl: false,
  playlist: [],
  youtubeResults: [],
  isSearching: false,
  isUploading: false,
  shareLink: '',
  showSharingModal: false,

  // Actions
  initializeSocket: () => {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('roomJoined', (roomId: string) => {
      set({ currentRoom: roomId });
    });

    socket.on('roomState', (roomState: any) => {
      set({
        playlist: roomState.playlist || [],
        isPlaying: roomState.isPlaying || false,
        volume: roomState.volume || 1,
        isController: roomState.controller === socket.id,
        hasControl: roomState.controller !== null,
        currentTrack: roomState.currentTrack || null,
      });
    });

    socket.on('play', () => {
      set({ isPlaying: true });
    });

    socket.on('pause', () => {
      set({ isPlaying: false });
    });

    socket.on('seek', (time: number) => {
      set({ currentTime: time });
    });

    socket.on('volumeChange', (volume: number) => {
      set({ volume });
    });

    socket.on('playlistUpdate', (playlist: Track[]) => {
      set({ playlist });
    });

    socket.on('trackAdded', (track: Track) => {
      set(state => ({ playlist: [...state.playlist, track] }));
    });

    socket.on('trackChanged', (track: Track) => {
      set({ currentTrack: track });
    });

    socket.on('trackRemoved', (data: { trackId: string }) => {
      set(state => ({
        playlist: state.playlist.filter(t => t.id !== data.trackId)
      }));
    });

    socket.on('userCountUpdate', (data: { userCount: number }) => {
      set({ userCount: data.userCount });
    });

    socket.on('controllerChanged', (data: { controller: string; isYou: boolean }) => {
      set({
        isController: data.isYou,
        hasControl: data.controller !== null
      });
    });

    socket.on('youtubeResults', (data: { results: YouTubeVideo[] }) => {
      set({ youtubeResults: data.results, isSearching: false });
    });

    socket.on('youtubeTrackAdded', (data: { track: Track }) => {
      set(state => ({ playlist: [...state.playlist, data.track] }));
    });

    socket.on('shareLink', (data: { shareLink: string }) => {
      set({ shareLink: data.shareLink });
    });

    set({ socket });
  },

  joinRoom: (roomId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  },

  leaveRoom: () => {
    const { socket, currentRoom } = get();
    if (socket && currentRoom) {
      socket.emit('leaveRoom', currentRoom);
      set({
        currentRoom: null,
        playlist: [],
        currentTrack: null,
        isPlaying: false,
        userCount: 0
      });
    }
  },

  playMusic: () => {
    const { socket, currentRoom, isController } = get();
    if (socket && currentRoom && isController) {
      socket.emit('play', currentRoom);
    }
  },

  pauseMusic: () => {
    const { socket, currentRoom, isController } = get();
    if (socket && currentRoom && isController) {
      socket.emit('pause', currentRoom);
    }
  },

  setVolume: (volume: number) => {
    const { socket, currentRoom } = get();
    set({ volume });
    if (socket && currentRoom) {
      socket.emit('volumeChange', { roomId: currentRoom, volume });
    }
  },

  seekToTime: (time: number) => {
    const { socket, currentRoom } = get();
    set({ currentTime: time });
    if (socket && currentRoom) {
      socket.emit('seek', { roomId: currentRoom, time });
    }
  },

  playTrack: (index: number) => {
    const { socket, currentRoom, playlist } = get();
    if (socket && currentRoom && playlist[index]) {
      socket.emit('changeTrack', { roomId: currentRoom, trackIndex: index });
    }
  },

  removeTrack: (trackId: string) => {
    const { socket, currentRoom } = get();
    if (socket && currentRoom) {
      socket.emit('trackRemoved', { roomId: currentRoom, trackId });
    }
  },

  uploadFile: async (file: File) => {
    set({ isUploading: true });
    
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const track: Track = {
          id: Date.now() + Math.random().toString(),
          name: file.name,
          url: result.fileUrl,
          size: result.size,
          type: file.type,
        };

        const { socket, currentRoom } = get();
        if (socket && currentRoom) {
          socket.emit('addTrack', { roomId: currentRoom, track });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      set({ isUploading: false });
    }
  },

  searchYouTube: (query: string) => {
    const { socket, currentRoom } = get();
    set({ isSearching: true });
    if (socket && currentRoom) {
      socket.emit('searchYouTube', { query, roomId: currentRoom });
    }
  },

  addYouTubeTrack: (videoId: string) => {
    const { socket, currentRoom } = get();
    if (socket && currentRoom) {
      socket.emit('addYouTubeTrack', { videoId, roomId: currentRoom });
    }
  },

  copyShareLink: () => {
    const { shareLink } = get();
    navigator.clipboard.writeText(shareLink);
  },

  hideSharingModal: () => {
    set({ showSharingModal: false });
  },
}));

