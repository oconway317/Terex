const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");

const { Server } = require("socket.io");

dotenv.config();

const pool = require("./src/config/db");
const messageRoutes = require("./src/routes/messageRoutes");
const channelRoutes = require("./src/routes/channelRoutes");
const testRoutes = require("./src/routes/testRoutes");
const authRoutes = require("./src/routes/authRoutes");
const searchRoutes = require("./src/routes/searchRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/channels/:id/messages", messageRoutes);
app.use("/api/search", searchRoutes);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_channel", (channelId) => {
    socket.join(`channel_${channelId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { channel_id, sender_id, message_text, message_type = "text", attachment_id = null } = data;

      const result = await pool.query(
        `
        INSERT INTO messages (channel_id, sender_id, message_text, message_type, attachment_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [channel_id, sender_id, message_text, message_type, attachment_id]
      );

      io.to(`channel_${channel_id}`).emit("receive_message", result.rows[0]);
    } catch (error) {
      console.error("Socket message save error:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});