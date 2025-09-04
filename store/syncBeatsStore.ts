import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export interface Track {
  id: string;
  name: string;
  url: string;
  size?: number;
  type: string;
  duration?: number;
  thumbnail?: string;
}

export interface RoomState {
  id: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playlist: Track[];
  controller: string | null;
  users: string[];
}

interface SyncBeatsState {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  
  // Room
  currentRoom: string | null;
  roomState: RoomState | null;
  userCount: number;
  
  // Player
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  
  // Control
  isController: boolean;
  hasControl: boolean;
  
  // Playlist
  playlist: Track[];
  
  // UI State
  isUploading: boolean;
  uploadProgress: number;
  showSharingModal: boolean;
  shareLink: string;
  
  // YouTube
  youtubeResults: any[];
  isSearching: boolean;
  
  // Actions
  initializeSocket: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  playMusic: (time?: number) => void;
  pauseMusic: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  uploadFile: (file: File) => Promise<void>;
  searchYouTube: (query: string) => void;
  addYouTubeTrack: (videoId: string) => void;
  playTrack: (index: number) => void;
  removeTrack: (trackId: string) => void;
  requestControl: () => void;
  showSharing: () => void;
  hideSharing: () => void;
  copyShareLink: () => void;
}

export const useSyncBeatsStore = create<SyncBeatsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      socket: null,
      isConnected: false,
      currentRoom: null,
      roomState: null,
      userCount: 0,
      currentTrack: null,
      isPlaying: false,
      volume: 1,
      currentTime: 0,
      duration: 0,
      isController: false,
      hasControl: false,
      playlist: [],
      isUploading: false,
      uploadProgress: 0,
      showSharingModal: false,
      shareLink: '',
      youtubeResults: [],
      isSearching: false,

      // Actions
      initializeSocket: () => {
        const socket = io('http://localhost:3001');
        
        socket.on('connect', () => {
          set({ socket, isConnected: true });
          toast.success('Connected to server');
        });

        socket.on('disconnect', () => {
          set({ isConnected: false });
          toast.error('Disconnected from server');
        });

        socket.on('roomJoined', (roomId: string) => {
          set({ currentRoom: roomId });
          toast.success(`Joined room: ${roomId}`);
        });

        socket.on('roomState', (roomState: RoomState) => {
          const { socket: currentSocket } = get();
          const isController = roomState.controller === currentSocket?.id;
          
          set({
            roomState,
            playlist: roomState.playlist,
            currentTrack: roomState.currentTrack,
            isPlaying: roomState.isPlaying,
            volume: roomState.volume,
            currentTime: roomState.currentTime,
            isController,
            hasControl: roomState.controller !== null,
            userCount: roomState.users.length,
          });
        });

        socket.on('play', (time: number) => {
          set({ isPlaying: true, currentTime: time });
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

        socket.on('trackChanged', (track: Track) => {
          set({ currentTrack: track, currentTime: 0 });
        });

        socket.on('playlistUpdate', (playlist: Track[]) => {
          set({ playlist });
        });

        socket.on('trackAdded', (track: Track) => {
          const { playlist } = get();
          set({ playlist: [...playlist, track] });
          toast.success(`Added: ${track.name}`);
        });

        socket.on('trackRemoved', ({ trackId }: { trackId: string }) => {
          const { playlist } = get();
          set({ playlist: playlist.filter(t => t.id !== trackId) });
        });

        socket.on('userCountUpdate', ({ userCount }: { userCount: number }) => {
          set({ userCount });
        });

        socket.on('controllerChanged', ({ controller, isYou }: { controller: string | null; isYou: boolean }) => {
          set({ isController: isYou, hasControl: controller !== null });
          if (isYou) {
            toast.success('You now have control');
          }
        });

        socket.on('controlDenied', ({ message }: { message: string }) => {
          toast.error(message);
        });

        socket.on('youtubeResults', ({ results }: { results: any[] }) => {
          set({ youtubeResults: results, isSearching: false });
        });

        socket.on('youtubeError', ({ error }: { error: string }) => {
          toast.error(`YouTube Error: ${error}`);
          set({ isSearching: false });
        });

        socket.on('shareLink', ({ shareLink }: { shareLink: string }) => {
          set({ shareLink });
        });

        set({ socket });
      },

      joinRoom: (roomId: string) => {
        const { socket } = get();
        if (socket && roomId.trim()) {
          socket.emit('joinRoom', roomId.trim());
        } else {
          toast.error('Please enter a valid room ID');
        }
      },

      leaveRoom: () => {
        const { socket, currentRoom } = get();
        if (socket && currentRoom) {
          socket.emit('leaveRoom', currentRoom);
          set({
            currentRoom: null,
            roomState: null,
            playlist: [],
            currentTrack: null,
            isPlaying: false,
            userCount: 0,
          });
          toast.success('Left room');
        }
      },

      playMusic: (time?: number) => {
        const { socket, currentRoom, isController, currentTrack } = get();
        
        if (!currentTrack) {
          toast.error('No track selected');
          return;
        }

        if (!isController) {
          get().requestControl();
          return;
        }

        if (socket && currentRoom) {
          socket.emit('play', currentRoom);
        }
      },

      pauseMusic: () => {
        const { socket, currentRoom, isController } = get();
        
        if (!isController) {
          get().requestControl();
          return;
        }

        if (socket && currentRoom) {
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

      seekTo: (time: number) => {
        const { socket, currentRoom } = get();
        set({ currentTime: time });
        if (socket && currentRoom) {
          socket.emit('seek', { roomId: currentRoom, time });
        }
      },

      uploadFile: async (file: File) => {
        const { socket, currentRoom } = get();
        
        if (!currentRoom) {
          toast.error('Please join a room first');
          return;
        }

        set({ isUploading: true, uploadProgress: 0 });

        try {
          const formData = new FormData();
          formData.append('audio', file);

          const response = await fetch('/api/upload', {
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

            if (socket && currentRoom) {
              socket.emit('addTrack', { roomId: currentRoom, track });
            }

            toast.success('File uploaded successfully');
          } else {
            toast.error(`Upload failed: ${result.error}`);
          }
        } catch (error) {
          toast.error('Upload failed. Please try again.');
        } finally {
          set({ isUploading: false, uploadProgress: 0 });
        }
      },

      searchYouTube: (query: string) => {
        const { socket, currentRoom } = get();
        
        if (!currentRoom) {
          toast.error('Please join a room first');
          return;
        }

        if (!query.trim()) {
          toast.error('Please enter a search term');
          return;
        }

        set({ isSearching: true });
        if (socket) {
          socket.emit('searchYouTube', { query: query.trim(), roomId: currentRoom });
        }
      },

      addYouTubeTrack: (videoId: string) => {
        const { socket, currentRoom } = get();
        
        if (!currentRoom) {
          toast.error('Please join a room first');
          return;
        }

        if (socket) {
          socket.emit('addYouTubeTrack', { videoId, roomId: currentRoom });
        }
      },

      playTrack: (index: number) => {
        const { socket, currentRoom, playlist } = get();
        const track = playlist[index];
        
        if (track && socket && currentRoom) {
          socket.emit('changeTrack', { roomId: currentRoom, trackIndex: index });
        }
      },

      removeTrack: (trackId: string) => {
        const { socket, currentRoom } = get();
        
        if (socket && currentRoom) {
          socket.emit('trackRemoved', { roomId: currentRoom, trackId });
        }
      },

      requestControl: () => {
        const { socket, currentRoom } = get();
        
        if (socket && currentRoom) {
          socket.emit('requestControl', currentRoom);
        }
      },

      showSharing: () => {
        const { socket, currentRoom } = get();
        set({ showSharingModal: true });
        
        if (socket && currentRoom) {
          socket.emit('getShareLink', currentRoom);
        }
      },

      hideSharing: () => {
        set({ showSharingModal: false });
      },

      copyShareLink: () => {
        const { shareLink } = get();
        navigator.clipboard.writeText(shareLink);
        toast.success('Link copied to clipboard!');
      },
    }),
    {
      name: 'syncbeats-store',
    }
  )
);