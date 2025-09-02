// Main SyncBeats Application Class
import { SocketManager } from '../services/SocketManager.js';
import { AudioManager } from '../services/AudioManager.js';
import { UIManager } from '../services/UIManager.js';
import { PlaylistManager } from '../services/PlaylistManager.js';
import { YouTubeManager } from '../services/YouTubeManager.js';
import { SharingManager } from '../services/SharingManager.js';
import { RoomManager } from '../services/RoomManager.js';

export class SyncBeatsApp {
  constructor() {
    this.currentRoom = null;
    this.isController = false;
    this.hasControl = false;

    // Initialize managers
    this.socketManager = new SocketManager(this);
    this.audioManager = new AudioManager(this);
    this.uiManager = new UIManager(this);
    this.playlistManager = new PlaylistManager(this);
    this.youtubeManager = new YouTubeManager(this);
    this.sharingManager = new SharingManager(this);
    this.roomManager = new RoomManager(this);

    this.init();
  }

  init() {
    this.socketManager.initialize();
    this.uiManager.bindEvents();
    this.audioManager.setupAudioEvents();
    this.uiManager.checkUrlForRoom();
  }

  // Getters for managers
  get socket() {
    return this.socketManager.socket;
  }

  get audio() {
    return this.audioManager.audio;
  }

  get currentTrack() {
    return this.audioManager.currentTrack;
  }

  get playlist() {
    return this.playlistManager.playlist;
  }

  get isPlaying() {
    return this.audioManager.isPlaying;
  }

  // Delegate methods to appropriate managers
  joinRoom(roomId) {
    this.roomManager.joinRoom(roomId);
  }

  leaveRoom() {
    this.roomManager.leaveRoom();
  }

  playMusic(time = null) {
    this.audioManager.playMusic(time);
  }

  pauseMusic() {
    this.audioManager.pauseMusic();
  }

  playTrack(index) {
    this.playlistManager.playTrack(index);
  }

  searchYouTube() {
    this.youtubeManager.searchYouTube();
  }

  addYouTubeTrack(videoId) {
    this.youtubeManager.addYouTubeTrack(videoId);
  }

  handleFileUpload(files) {
    this.playlistManager.handleFileUpload(files);
  }

  showSharingSection() {
    this.sharingManager.showSharingSection();
  }

  copyShareLink() {
    this.sharingManager.copyShareLink();
  }

  shareOnWhatsApp() {
    this.sharingManager.shareOnWhatsApp();
  }

  shareOnTelegram() {
    this.sharingManager.shareOnTelegram();
  }

  shareViaEmail() {
    this.sharingManager.shareViaEmail();
  }
}