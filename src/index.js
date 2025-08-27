// SyncBeats Client Application
class SyncBeats {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentTrack = null;
        this.playlist = [];
        this.syncInterval = null;
        
        this.initializeSocket();
        this.bindEvents();
        this.setupAudioEvents();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
        });

        this.socket.on('roomJoined', (roomId) => {
            this.currentRoom = roomId;
            this.updateRoomStatus(roomId);
            this.showPlayerSection();
            this.showPlaylistSection();
        });

        this.socket.on('roomState', (roomState) => {
            this.updateRoomState(roomState);
        });

        this.socket.on('play', (time) => {
            this.playMusic(time);
        });

        this.socket.on('pause', () => {
            this.pauseMusic();
        });

        this.socket.on('seek', (time) => {
            this.seekToTime(time);
        });

        this.socket.on('volumeChange', (volume) => {
            this.setVolume(volume);
        });

        this.socket.on('playlistUpdate', (playlist) => {
            this.updatePlaylist(playlist);
        });

        this.socket.on('trackAdded', (track) => {
            this.addTrackToPlaylist(track);
        });

        this.socket.on('trackChanged', (track) => {
            this.changeTrack(track);
        });

        this.socket.on('syncTime', (time) => {
            this.syncTime(time);
        });

        // YouTube events
        this.socket.on('youtubeResults', (data) => {
            this.displayYouTubeResults(data.results);
        });

        this.socket.on('youtubeTrackAdded', (data) => {
            this.addTrackToPlaylist(data.track);
            alert(`Added YouTube track: ${data.track.name}`);
        });

        this.socket.on('youtubeError', (data) => {
            alert(`YouTube Error: ${data.error}`);
        });

        // Sharing events
        this.socket.on('shareLink', (data) => {
            this.updateShareLink(data.shareLink);
        });
    }

    bindEvents() {
        // Room management
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.joinRoom();
        });

        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Player controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.playMusic();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseMusic();
        });

        // Volume control
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setVolume(volume);
            this.socket.emit('volumeChange', { roomId: this.currentRoom, volume });
        });

        // Seek control
        document.getElementById('seekSlider').addEventListener('input', (e) => {
            const seekTime = (e.target.value / 100) * this.audio.duration;
            this.seekToTime(seekTime);
        });

        // File upload
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        const uploadSection = document.getElementById('uploadSection');
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('dragover');
        });

        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('dragover');
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // YouTube search
        document.getElementById('searchYoutubeBtn').addEventListener('click', () => {
            this.searchYouTube();
        });

        // Room sharing
        document.getElementById('shareRoomBtn').addEventListener('click', () => {
            this.showSharingSection();
        });

        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyShareLink();
        });

        document.getElementById('shareWhatsAppBtn').addEventListener('click', () => {
            this.shareOnWhatsApp();
        });

        document.getElementById('shareTelegramBtn').addEventListener('click', () => {
            this.shareOnTelegram();
        });

        document.getElementById('shareEmailBtn').addEventListener('click', () => {
            this.shareViaEmail();
        });

        // Check for room parameter in URL
        this.checkUrlForRoom();
    }

    setupAudioEvents() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.updateSeekSlider();
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateTimeDisplay();
            this.updateSeekSlider();
            
            // Sync time with other users every 2 seconds
            if (this.isPlaying && this.currentRoom) {
                this.socket.emit('syncTime', { 
                    roomId: this.currentRoom, 
                    time: this.audio.currentTime 
                });
            }
        });

        this.audio.addEventListener('ended', () => {
            this.playNextTrack();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            alert('Error playing audio file');
        });
    }

    joinRoom() {
        const roomId = document.getElementById('roomId').value.trim();
        if (!roomId) {
            alert('Please enter a room ID');
            return;
        }

        this.socket.emit('joinRoom', roomId);
    }

    leaveRoom() {
        if (this.currentRoom) {
            this.socket.emit('leaveRoom', this.currentRoom);
            this.currentRoom = null;
            this.hidePlayerSection();
            this.hidePlaylistSection();
            this.updateRoomStatus(null);
            this.stopMusic();
        }
    }

    playMusic(time = null) {
        if (!this.currentTrack) {
            alert('No track selected. Please upload music first.');
            return;
        }

        if (time !== null) {
            this.audio.currentTime = time;
        }

        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.startSyncInterval();
        }).catch(error => {
            console.error('Error playing audio:', error);
            alert('Error playing audio. Please check your browser settings.');
        });

        if (this.currentRoom) {
            this.socket.emit('play', this.currentRoom);
        }
    }

    pauseMusic() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopSyncInterval();

        if (this.currentRoom) {
            this.socket.emit('pause', this.currentRoom);
        }
    }

    stopMusic() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopSyncInterval();
    }

    seekToTime(time) {
        if (this.audio.duration) {
            this.audio.currentTime = time;
            if (this.currentRoom) {
                this.socket.emit('seek', { roomId: this.currentRoom, time });
            }
        }
    }

    setVolume(volume) {
        this.audio.volume = volume;
        document.getElementById('volumeSlider').value = volume * 100;
        document.getElementById('volumeValue').textContent = Math.round(volume * 100) + '%';
    }

    changeTrack(track) {
        this.currentTrack = track;
        this.audio.src = track.url;
        this.updateCurrentTrackDisplay();
        this.loadAudio();
    }

    playNextTrack() {
        if (this.playlist.length > 0) {
            const currentIndex = this.playlist.findIndex(track => track.id === this.currentTrack?.id);
            const nextIndex = (currentIndex + 1) % this.playlist.length;
            const nextTrack = this.playlist[nextIndex];
            
            if (nextTrack) {
                this.changeTrack(nextTrack);
                if (this.isPlaying) {
                    this.playMusic();
                }
            }
        }
    }

    loadAudio() {
        this.audio.load();
        this.updateCurrentTrackDisplay();
    }

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('audio/')) {
                this.uploadFile(file);
            } else {
                alert(`${file.name} is not an audio file`);
            }
        });
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('audio', file);

        this.showUploadProgress();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                const track = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    url: result.fileUrl,
                    size: result.size,
                    type: file.type
                };

                this.addTrackToPlaylist(track);
                
                if (this.currentRoom) {
                    this.socket.emit('addTrack', { roomId: this.currentRoom, track });
                }

                if (!this.currentTrack) {
                    this.currentTrack = track;
                    this.loadAudio();
                }
            } else {
                alert('Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            this.hideUploadProgress();
        }
    }

    addTrackToPlaylist(track) {
        this.playlist.push(track);
        this.updatePlaylistDisplay();
    }

    updatePlaylist(playlist) {
        this.playlist = playlist;
        this.updatePlaylistDisplay();
    }

    updatePlaylistDisplay() {
        const playlistElement = document.getElementById('playlist');
        
        if (this.playlist.length === 0) {
            playlistElement.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">No tracks in playlist yet</p>';
            return;
        }

        playlistElement.innerHTML = this.playlist.map((track, index) => `
            <div class="playlist-item ${track.id === this.currentTrack?.id ? 'current' : ''}">
                <div>
                    <strong>${track.name}</strong>
                    <br>
                    <small>${track.type === 'youtube' ? 'YouTube Video' : this.formatFileSize(track.size)}</small>
                    ${track.type === 'youtube' && track.thumbnail ? `<br><img src="${track.thumbnail}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; margin-top: 5px;">` : ''}
                </div>
                <div>
                    <button class="btn btn-secondary" onclick="syncBeats.playTrack(${index})">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateRoomStats();
    }

    playTrack(index) {
        const track = this.playlist[index];
        if (track) {
            this.changeTrack(track);
            if (this.currentRoom) {
                this.socket.emit('changeTrack', { roomId: this.currentRoom, trackIndex: index });
            }
            this.playMusic();
        }
    }

    updateRoomState(roomState) {
        this.playlist = roomState.playlist || [];
        this.currentTrack = roomState.currentTrack;
        this.isPlaying = roomState.isPlaying;
        this.audio.volume = roomState.volume;
        
        this.updatePlaylistDisplay();
        this.updateCurrentTrackDisplay();
        this.updateVolumeDisplay();
        
        if (this.currentTrack) {
            this.loadAudio();
        }
    }

    startSyncInterval() {
        this.stopSyncInterval();
        this.syncInterval = setInterval(() => {
            if (this.isPlaying && this.currentRoom) {
                this.socket.emit('syncTime', { 
                    roomId: this.currentRoom, 
                    time: this.audio.currentTime 
                });
            }
        }, 2000);
    }

    stopSyncInterval() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    syncTime(time) {
        if (Math.abs(this.audio.currentTime - time) > 1) {
            this.audio.currentTime = time;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (connected) {
            statusElement.className = 'status connected';
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
        } else {
            statusElement.className = 'status disconnected';
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Disconnected';
        }
    }

    updateRoomStatus(roomId) {
        const roomStatusElement = document.getElementById('roomStatus');
        const currentRoomElement = document.getElementById('currentRoom');
        const shareRoomBtn = document.getElementById('shareRoomBtn');
        
        if (roomId) {
            roomStatusElement.classList.remove('hidden');
            currentRoomElement.textContent = roomId;
            shareRoomBtn.style.display = 'inline-flex';
            this.updateRoomStats();
        } else {
            roomStatusElement.classList.add('hidden');
            shareRoomBtn.style.display = 'none';
            document.getElementById('sharingSection').style.display = 'none';
        }
    }

    showPlayerSection() {
        document.getElementById('playerSection').classList.remove('hidden');
        document.getElementById('noRoomMessage').classList.add('hidden');
    }

    hidePlayerSection() {
        document.getElementById('playerSection').classList.add('hidden');
        document.getElementById('noRoomMessage').classList.remove('hidden');
    }

    showPlaylistSection() {
        document.getElementById('playlistSection').classList.remove('hidden');
    }

    hidePlaylistSection() {
        document.getElementById('playlistSection').classList.add('hidden');
    }

    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPlaying) {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
        } else {
            playBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
        }
    }

    updateCurrentTrackDisplay() {
        const currentTrackElement = document.getElementById('currentTrack');
        if (this.currentTrack) {
            currentTrackElement.textContent = this.currentTrack.name;
        } else {
            currentTrackElement.textContent = 'No track selected';
        }
    }

    updateVolumeDisplay() {
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        volumeSlider.value = this.audio.volume * 100;
        volumeValue.textContent = Math.round(this.audio.volume * 100) + '%';
    }

    updateTimeDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        const currentTime = this.formatTime(this.audio.currentTime);
        const duration = this.formatTime(this.audio.duration);
        timeDisplay.textContent = `${currentTime} / ${duration}`;
    }

    updateSeekSlider() {
        const seekSlider = document.getElementById('seekSlider');
        if (this.audio.duration && isFinite(this.audio.duration)) {
            seekSlider.max = this.audio.duration;
            seekSlider.value = this.audio.currentTime;
        }
    }

    showUploadProgress() {
        document.getElementById('uploadProgress').classList.remove('hidden');
        document.getElementById('uploadStatus').textContent = 'Uploading...';
    }

    hideUploadProgress() {
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('progressFill').style.width = '0%';
    }

    formatTime(seconds) {
        if (!seconds || !isFinite(seconds)) return '00:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // YouTube Methods
    searchYouTube() {
        const query = document.getElementById('youtubeSearch').value.trim();
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        if (!this.currentRoom) {
            alert('Please join a room first');
            return;
        }

        this.socket.emit('searchYouTube', { query, roomId: this.currentRoom });
        document.getElementById('youtubeResults').classList.remove('hidden');
    }

    displayYouTubeResults(results) {
        const resultsList = document.getElementById('youtubeResultsList');
        
        if (results.length === 0) {
            resultsList.innerHTML = '<p>No results found</p>';
            return;
        }

        resultsList.innerHTML = results.map(video => `
            <div class="youtube-result-item">
                <img src="${video.thumbnail}" alt="${video.title}" class="youtube-thumbnail">
                <div class="youtube-info">
                    <div class="youtube-title">${video.title}</div>
                    <div class="youtube-duration">${this.formatTime(video.duration)}</div>
                </div>
                <button class="youtube-add-btn" onclick="syncBeats.addYouTubeTrack('${video.videoId}')">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        `).join('');
    }

    addYouTubeTrack(videoId) {
        if (!this.currentRoom) {
            alert('Please join a room first');
            return;
        }

        this.socket.emit('addYouTubeTrack', { videoId, roomId: this.currentRoom });
    }

    // Sharing Methods
    showSharingSection() {
        document.getElementById('sharingSection').style.display = 'block';
        this.socket.emit('getShareLink', this.currentRoom);
    }

    updateShareLink(shareLink) {
        document.getElementById('shareLink').value = shareLink;
    }

    copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        document.execCommand('copy');
        alert('Link copied to clipboard!');
    }

    shareOnWhatsApp() {
        const shareLink = document.getElementById('shareLink').value;
        const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareOnTelegram() {
        const shareLink = document.getElementById('shareLink').value;
        const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank');
    }

    shareViaEmail() {
        const shareLink = document.getElementById('shareLink').value;
        const subject = 'Join me on SyncBeats! 🎵';
        const body = `Hey! I'm listening to music on SyncBeats and would love for you to join!\n\nClick this link to join: ${shareLink}\n\nSee you there! 🎶`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    }

    // URL Room Detection
    checkUrlForRoom() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomParam = urlParams.get('room');
        
        if (roomParam) {
            document.getElementById('roomId').value = roomParam;
            // Auto-join after a short delay to ensure socket is connected
            setTimeout(() => {
                this.joinRoom();
            }, 1000);
        }
    }

    // Enhanced room status updates
    updateRoomStats() {
        if (this.currentRoom) {
            document.getElementById('userCount').textContent = this.playlist.length > 0 ? '1+' : '1';
            document.getElementById('trackCount').textContent = this.playlist.length;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.syncBeats = new SyncBeats();
});

// Handle page visibility changes to pause music when tab is not active
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.syncBeats && window.syncBeats.isPlaying) {
        // Optionally pause music when tab is not visible
        // window.syncBeats.pauseMusic();
    }
});
