// server/src/index.js (modified)
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const routes = require("./routes");
const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/error");
const attachSocket = require("./socket");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

// attach io to app for routes/workers to use
app.set("io", io);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    if (process.env.MONGO_URI) await connectDB(process.env.MONGO_URI);
    attachSocket(io);

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () =>
      console.log(`API + socket on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
