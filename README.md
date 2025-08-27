# SyncBeats 🎵

A real-time synchronized music listening tool that allows you and your friends to listen to the same music simultaneously while on audio calls (WhatsApp, Google Meet, Zoom, etc.).

## ✨ Features

- **Real-time synchronization**: All users in a room hear music at the same time
- **Room-based system**: Create or join rooms with custom IDs
- **YouTube integration**: Search and add YouTube videos directly to your playlist
- **Direct link sharing**: Share room links for instant joining without latency
- **File upload support**: Upload your own audio files (MP3, WAV, OGG, etc.)
- **Playlist management**: Build and share playlists with friends
- **Volume control**: Individual volume control for each user
- **Seek functionality**: Jump to any point in the track
- **Responsive design**: Works on desktop and mobile devices
- **Drag & drop**: Easy file upload with drag and drop support
- **Social sharing**: Share rooms on WhatsApp, Telegram, and email

## 🚀 How It Works

1. **Join a Room**: Enter a room ID (e.g., "party123") and click "Join Room"
2. **Add Music**: Upload audio files or search YouTube for videos
3. **Share Room**: Click "Share Room" to get a direct join link
4. **Start Listening**: Click play and everyone in the room hears the same music
5. **Stay in Sync**: The app automatically keeps everyone synchronized

## 🛠️ Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd syncbeats
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the frontend**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage

### For Users

1. **Open SyncBeats** in your web browser
2. **Enter a room ID** (e.g., "party123", "gaming", "study") or use a direct link
3. **Click "Join Room"**
4. **Add music** by uploading files or searching YouTube
5. **Click play** to start synchronized listening
6. **Share the room** using the share button for instant joining

### For Friends

1. **Click the shared link** - they'll be taken directly to the room
2. **Or enter the room ID** manually
3. **Click "Join Room"**
4. **Start listening** - the music will automatically sync!

## 🎯 Perfect For

- **Gaming sessions** - Listen to the same background music
- **Study groups** - Synchronized focus music
- **Virtual parties** - Dance to the same beat
- **Work meetings** - Background ambiance
- **Long-distance relationships** - Share music experiences

## 🔧 Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-restart
- `npm run build` - Build the frontend assets
- `npm run dev-build` - Build and watch for changes

### Project Structure

```
syncbeats/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── webpack.config.js  # Webpack configuration
├── public/            # Static files
│   └── index.html     # Main HTML file
├── src/               # Source code
│   └── index.js       # Main client-side JavaScript
├── uploads/           # Uploaded audio files (auto-created)
└── README.md          # This file
```

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📋 Requirements

- Modern web browser with audio support
- Stable internet connection
- Audio files in common formats (MP3, WAV, OGG, etc.)

## 🔒 Privacy & Security

- Audio files are stored temporarily on the server
- Room IDs are simple text strings - choose unique ones
- No user accounts or personal data collection
- All communication is real-time via WebSocket

## 🐛 Troubleshooting

### Common Issues

1. **Audio won't play**
   - Check browser audio permissions
   - Ensure audio files are valid
   - Try refreshing the page

2. **Sync issues**
   - Check internet connection
   - Ensure all users are in the same room
   - Try rejoining the room

3. **Upload fails**
   - Check file format (audio files only)
   - Ensure file size isn't too large
   - Check browser console for errors

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Ensure all dependencies are installed
3. Verify the server is running
4. Check that the port 3000 is available

## 🤝 Contributing

Feel free to contribute to this project! Some areas for improvement:
- Better audio format support
- User authentication
- Persistent playlists
- Mobile app version
- Better sync algorithms

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with Node.js, Express, and Socket.IO
- Frontend uses vanilla JavaScript and modern CSS
- Icons provided by Font Awesome
- Fonts from Google Fonts

---

**Happy listening together! 🎶**
