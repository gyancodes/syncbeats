# SyncBeats

Real-time collaborative music listening application. Multiple users can join a room and listen to the same music together, perfectly synchronized.

## Features

- Room-based sessions with shareable codes
- YouTube video search and playback
- Local audio track playback
- Real-time playback synchronization (play, pause, seek)
- Live user presence

## Tech Stack

**Frontend**
- React 18
- Vite
- Socket.IO Client
- React Router

**Backend**
- Node.js
- Express
- Socket.IO
- YouTube Data API v3 (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/gyancodes/syncbeats.git
cd syncbeats
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

### Configuration (Optional)

To enable YouTube search with real results, set a YouTube Data API key:

```bash
# In server directory, create .env file
YOUTUBE_API_KEY=your_api_key_here
```

Without an API key, the app uses mock search results for demo purposes.

### Running the Application

1. Start the backend server
```bash
cd server
npm start
```
Server runs on http://localhost:3001

2. Start the frontend development server
```bash
cd client
npm run dev
```
App runs on http://localhost:5173

## Usage

1. Open the app in your browser
2. Enter your name
3. Create a new room or join with a room code
4. Search for music on YouTube or select a local track
5. Share the room code with friends
6. Playback is synchronized across all connected users

## Project Structure

```
syncbeats/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # React context providers
│   │   ├── data/           # Static data (demo tracks)
│   │   └── pages/          # Page components
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js            # Express server + Socket.IO
│   ├── roomManager.js      # Room state management
│   ├── syncHandler.js      # Playback sync logic
│   ├── youtubeService.js   # YouTube API integration
│   └── package.json
└── README.md
```

