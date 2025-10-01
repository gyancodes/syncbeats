// Room State Management
class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.roomLinks = new Map();
  }

  joinRoom(roomId, userId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Set(),
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        volume: 1,
        playlist: [],
        createdAt: Date.now(),
        creator: userId,
        controller: null,
        lastActionTime: null,
        lastActionBy: null,
      });
    }

    const room = this.rooms.get(roomId);
    room.users.add(userId);

    // Generate share link if not exists
    if (!this.roomLinks.has(roomId)) {
      const shareLink = `http://localhost:3002/join/${roomId}`;
      this.roomLinks.set(roomId, shareLink);
    }

    return room;
  }

  leaveRoom(roomId, userId) {
    if (!this.rooms.has(roomId)) return null;

    const room = this.rooms.get(roomId);
    room.users.delete(userId);

    // If the leaving user was the controller, clear controller
    if (room.controller === userId) {
      room.controller = null;
      room.lastActionTime = null;
    }

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      this.roomLinks.delete(roomId);
      return null;
    }

    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      currentTrack: room.currentTrack,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      volume: room.volume,
      playlist: room.playlist,
      controller: room.controller,
      users: Array.from(room.users),
    };
  }

  getShareLink(roomId) {
    return this.roomLinks.get(roomId) || `http://localhost:3002/join/${roomId}`;
  }

  getAllRooms() {
    return Array.from(this.rooms.entries()).map(([id, room]) => ({
      id: room.id,
      userCount: room.users.size,
      currentTrack: room.currentTrack,
      isPlaying: room.isPlaying,
      createdAt: room.createdAt,
    }));
  }

  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      return {
        exists: true,
        roomId: room.id,
        userCount: room.users.size,
        currentTrack: room.currentTrack,
        isPlaying: room.isPlaying,
      };
    }
    return { exists: false };
  }

  handleUserDisconnect(userId, io) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(userId)) {
        room.users.delete(userId);

        // If the disconnecting user was the controller, clear controller
        if (room.controller === userId) {
          room.controller = null;
          room.lastActionTime = null;

          // Notify remaining users that control is available
          io.to(roomId).emit("controllerChanged", {
            controller: null,
            isYou: false,
          });
        }

        if (room.users.size === 0) {
          this.rooms.delete(roomId);
          this.roomLinks.delete(roomId);
        } else {
          // Broadcast updated user count to remaining users
          const userCount = room.users.size;
          io.to(roomId).emit("userCountUpdate", { userCount, roomId });
        }
      }
    }
  }
}

module.exports = { RoomManager };