const { User, sequelize } = require("../models");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const messageService = require("../services/message.service");

const redisClient = require("../config/redis");
const { isRateLimited } = require("../utils/rateLimiter");

module.exports = (server) => {

  const io = require("socket.io")(server);

  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        return next(new Error("Authentication required"));
      }

      const cookies = cookie.parse(rawCookie);
      const token = cookies.token;

      if (!token) {
        return next(new Error("Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {

    socket.on("join", async () => {
      const userId = socket.userId;
      socket.join(`user:${userId}`);

      const keys = await redisClient.keys(
        `unread:${userId}:*`
      )

      const unreadCounts = []

      for (const key of keys){
        const count = await redisClient.get(key);
        const senderId = key.split(":")[2];

        unreadCounts.push({
        senderId: Number(senderId),
        count: Number(count)
      })
      }

      socket.emit("unread_counts", unreadCounts);

      io.emit("user_status", {
        userId,
        onlineStatus: true,
      });
    });

    socket.on("send_message", async (data) => {
      try {
        if(!data?.receiverId || !data?.message) return;
        console.log(data);
        

        const allowedTypes = ["text", "image", "video", "audio", "file"];
        if (data.type && !allowedTypes.includes(data.type)) return;

        const limited = await isRateLimited(socket.userId);
          if (limited) {
            socket.emit("rate_limited", {
              message: "Too many messages. Please slow down message count.",
            });
            return;
          }

        const msg = await messageService.createMessage({
          senderId: socket.userId,
          receiverId: data.receiverId,
          message: data.message,
          type: data.type,
        });


        const receiverActiveChat = await redisClient.get(
          `active_chat:${data.receiverId}`
        );

        if (Number(receiverActiveChat) !== Number(socket.userId)) {
          await redisClient.incr(
            `unread:${data.receiverId}:${socket.userId}`
          )
          io.to(`user:${data.receiverId}`).emit("unread_update", {
            fromUserId: socket.userId,
          });
        } else {
          await messageService.markMessagesRead({
            senderId: socket.userId,
            receiverId: data.receiverId,
          });
        }
        
        io
          .to(`user:${data.receiverId}`)
          .to(`user:${socket.userId}`)
          .emit("receive_message", msg);
        // io.to(`user:${socket.userId}`).emit("receive_message", msg);
      } catch (err) {
        console.error("Message send error:", err.message);
      }
    });

    socket.on("typing", async({ receiverId }) => {
      const senderId = socket.userId;

      const receiverActiveChat = await redisClient.get(
        `active_chat:${receiverId}`
      )

      if (Number(receiverActiveChat) === Number(senderId)) {
        io.to(`user:${receiverId}`).emit("user_typing", {
          senderId,
        });
      }
    });

    socket.on("stop_typing", ({ receiverId }) => {
      const senderId = socket.userId;

      io.to(`user:${receiverId}`).emit("stop_typing", {
        senderId,
      });
    });

    socket.on("chat_opened", async({ withUserId }) => {
      // activeChats.set(socket.userId, withUserId);
      if(!withUserId) return
      await redisClient.set(
        `active_chat:${socket.userId}`,
        withUserId
      )
    });

    socket.on("mark_read", async ({ withUserId }) => {
      if (!withUserId) return;

      await redisClient.del(
        `unread:${socket.userId}:${withUserId}`
      );

      await messageService.markMessagesRead({
        senderId: withUserId,
        receiverId: socket.userId,
      });
    });

    socket.on("disconnect", async () => {
      const userId = socket.userId;
      if (!userId) return;

      socket.leave(`user:${userId}`);

      const lastSeen = new Date();

      try {
        await User.update({ lastSeen }, { where: { id: userId } });
      } catch (error) {
        console.error(error, "Error in updating Last Seen");
      }
      io.emit("user_status", {
        userId,
        onlineStatus: false,
        lastSeen,
      });

      // activeChats.delete(socket.userId);
      await redisClient.del(
        `active_chat:${socket.userId}`
      )
      io.emit("stop_typing", {
        senderId: socket.userId,
      });

      console.log("User disconnected:", userId);
    });
  });
};