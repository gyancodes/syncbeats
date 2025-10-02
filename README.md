# SyncBeats - Synchronized Music Listening

A real-time synchronized music listening application that allows multiple users to listen to the same music together in virtual rooms.

## Features

- 🎵 **Synchronized Playback**: All users in a room listen to the same music at the same time
- 🎛️ **Real-time Controls**: Play, pause, seek, and volume controls synchronized across all users
- 🎵 **Multiple Music Sources**: Upload audio files or add music from YouTube
- 👥 **Room-based Sharing**: Create and join rooms to listen with friends
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Auto-sync**: Automatic time synchronization to keep everyone in sync

## Project Structure

```
syncbeats/
├── server/               # Express.js backend server
│   ├── services/         # Server services
│   ├── routes/           # API routes
│   ├── app.js           # Main server class
│   └── index.js         # Server entry point
├── uploads/              # Uploaded audio files
├── public/              # Static assets
├── start.bat            # Windows start script
└── package.json         # Dependencies and scripts
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd syncbeats
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and go to `http://localhost:3001`

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## How It Works

### Synchronization
- The server maintains the state of each room (current track, playback position, etc.)
- When a user performs an action (play, pause, seek), it's broadcast to all other users in the room
- Time synchronization happens every 2 seconds to keep everyone in sync
- Only one user can control playback at a time (controller system)

### Room System
- Users can create or join rooms using a room ID
- Each room has its own playlist and playback state
- Rooms are automatically cleaned up when empty
- Share links allow easy room joining

### Music Sources
- **File Upload**: Users can upload audio files (MP3, WAV, etc.)
- **YouTube**: Search and add music from YouTube videos
- **Playlist Management**: Add, remove, and reorder tracks

## API Endpoints

- `POST /upload` - Upload audio files
- `GET /uploads/:filename` - Serve uploaded files
- `GET /api/youtube/:videoId` - Get YouTube audio URL

## Socket Events

### Client to Server
- `joinRoom` - Join a room
- `leaveRoom` - Leave a room
- `play` - Start playback
- `pause` - Pause playback
- `seek` - Seek to position
- `volumeChange` - Change volume
- `addTrack` - Add track to playlist
- `changeTrack` - Change current track
- `searchYouTube` - Search YouTube
- `addYouTubeTrack` - Add YouTube track

### Server to Client
- `roomJoined` - Successfully joined room
- `roomState` - Current room state
- `play` - Start playback (from other user)
- `pause` - Pause playback (from other user)
- `trackChanged` - Track changed
- `playlistUpdate` - Playlist updated
- `userCountUpdate` - User count changed
- `controllerChanged` - Control changed hands

## Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **YouTube Integration**: ytdl-core, yt-search
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details