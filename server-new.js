// New Modular Server Entry Point
const { SyncBeatsServer } = require("./src/server/app");

const server = new SyncBeatsServer();
const PORT = process.env.PORT || 3002;

server.start(PORT);