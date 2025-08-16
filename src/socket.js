// server/src/socket.js
module.exports = function attachSocket(io) {
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // join room for user if client sends userId after auth
    socket.on("identify", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`socket ${socket.id} joined user:${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected:", socket.id);
    });
  });
};
