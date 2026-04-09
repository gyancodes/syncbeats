const { v4: uuidv4 } = require("uuid");

// In-memory storage for rooms
const rooms = new Map();

/**
 * Generate a unique room code (6 characters)
 */
function generateRoomCode() {
  return uuidv4().substring(0, 6).toUpperCase();
}

/**
 * Create a new room
 */
function createRoom(hostId, hostName) {
  const roomCode = generateRoomCode();
  const room = {
    code: roomCode,
    hostId: hostId,
    users: new Map(),
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    youtubeVideo: null,
    youtubeIsPlaying: false,
    youtubeCurrentTime: 0,
    lastUpdate: Date.now(),
    createdAt: Date.now(),
  };

  rooms.set(roomCode, room);
  return room;
}

/**
 * Get a room by code
 */
function getRoom(roomCode) {
  return rooms.get(roomCode.toUpperCase());
}

/**
 * Add user to a room
 */
function addUserToRoom(roomCode, userId, userName) {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.users.set(userId, {
    id: userId,
    name: userName,
    joinedAt: Date.now(),
  });

  return room;
}

/**
 * Remove user from a room
 */
function removeUserFromRoom(roomCode, userId) {
  const room = getRoom(roomCode);
  if (!room) return null;

  room.users.delete(userId);

  // Delete room if empty
  if (room.users.size === 0) {
    rooms.delete(roomCode);
    return null;
  }

  // Transfer host if host left
  if (room.hostId === userId) {
    const newHost = room.users.keys().next().value;
    room.hostId = newHost;
  }

  return room;
}

/**
 * Get users in a room as array
 */
function getRoomUsers(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return [];
  return Array.from(room.users.values());
}

/**
 * Update room playback state
 */
function updatePlaybackState(roomCode, state) {
  const room = getRoom(roomCode);
  if (!room) return null;

  if (state.currentTrack !== undefined) room.currentTrack = state.currentTrack;
  if (state.isPlaying !== undefined) room.isPlaying = state.isPlaying;
  if (state.currentTime !== undefined) room.currentTime = state.currentTime;
  if (state.youtubeVideo !== undefined) room.youtubeVideo = state.youtubeVideo;
  if (state.youtubeIsPlaying !== undefined) room.youtubeIsPlaying = state.youtubeIsPlaying;
  if (state.youtubeCurrentTime !== undefined) room.youtubeCurrentTime = state.youtubeCurrentTime;
  room.lastUpdate = Date.now();

  return room;
}

/**
 * Get room playback state
 */
function getPlaybackState(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return null;

  return {
    currentTrack: room.currentTrack,
    isPlaying: room.isPlaying,
    currentTime: room.currentTime,
    youtubeVideo: room.youtubeVideo,
    youtubeIsPlaying: room.youtubeIsPlaying,
    youtubeCurrentTime: room.youtubeCurrentTime,
    lastUpdate: room.lastUpdate,
  };
}

module.exports = {
  createRoom,
  getRoom,
  addUserToRoom,
  removeUserFromRoom,
  getRoomUsers,
  updatePlaybackState,
  getPlaybackState,
};
