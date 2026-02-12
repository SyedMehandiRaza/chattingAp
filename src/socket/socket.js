const {
  User,
  sequelize,
  Message,
  Reaction,
  ChatParticipant,
  ChatList,
} = require("../models");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const messageService = require("../services/message.service");
const redisClient = require("../config/redis");
const { isRateLimited } = require("../utils/rateLimiter");
const { Op, Transaction } = require("sequelize");
const { message } = require("statuses");

module.exports = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

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
      socket.userName = decoded.name;
      next();
    } catch (err) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    socket.on("join", async () => {
      const userId = socket.userId;
      socket.join(`user:${socket.userId}`);

      let keys = [];
      try {
        keys = await redisClient.keys(`unread:${userId}:*`);
      } catch (err) {
        console.error("Redis error:", err.message);
      }

      const unreadCounts = [];

      for (const key of keys) {
        const count = await redisClient.get(key);
        const senderId = key.split(":")[2];

        unreadCounts.push({
          senderId: Number(senderId),
          count: Number(count),
        });
      }

      socket.emit("unread_counts", unreadCounts);

      io.emit("user_status", {
        userId,
        onlineStatus: true,
      });
    });

    socket.on("join_chat", ({ chatListId }) => {
      if (!chatListId) return;
      socket.join(`chat:${chatListId}`);
    });

    await User.update({ onlineStatus: true }, { where: { id: socket.userId } });

    socket.on("send_message", async (data) => {
      console.log("socketn on sendMessage");
      let { chatListId, message, type, receiverId } = data;
      const senderId = socket.userId;

      if (!message) return;

      const t = await sequelize.transaction();
      console.log(chatListId);
      console.log(receiverId);
      try {
        if (!chatListId && receiverId) {
          const senderChats = await ChatParticipant.findAll({
            where: { userId: senderId },
            attributes: ["chatListId"],
            raw: true,
            transaction: t,
          });

          const chatIds = senderChats.map((c) => c.chatListId);

          let existingChat = null;

          if (chatIds.length) {
            existingChat = await ChatList.findOne({
              where: {
                id: { [Op.in]: chatIds },
                type: "private",
              },
              include: [
                {
                  model: ChatParticipant,
                  as: "participants",
                  where: { userId: receiverId },
                  required: true,
                },
              ],
              transaction: t,
            });
          }

          if (existingChat) {
            chatListId = existingChat.id;
          } else {
            // 2️⃣ create chat
            const chat = await ChatList.create(
              { type: "private" },
              { transaction: t }
            );

            await ChatParticipant.bulkCreate(
              [
                { chatListId: chat.id, userId: senderId },
                { chatListId: chat.id, userId: receiverId },
              ],
              { transaction: t }
            );

            chatListId = chat.id;
          }
        }

        const msg = await Message.create(
          {
            chatListId,
            senderId,
            message,
            type: type || "text",
          },
          { transaction: t }
        );

        await ChatList.update(
          { lastMessageId: msg.id },
          { where: { id: chatListId }, transaction: t }
        );

        await t.commit();

        io.to(`user:${senderId}`).emit("receive_message", msg);
        io.to(`user:${receiverId}`).emit("receive_message", msg);
      } catch (err) {
        await t.rollback();
        console.error(err);
      }
    });

    socket.on("typing", ({ chatListId }) => {
      socket.to(`chat:${chatListId}`).emit("user_typing", {
        userId: socket.userId,
        chatListId,
      });
    });

    socket.on("stop_typing", ({ chatListId }) => {
      socket.to(`chat:${chatListId}`).emit("stop_typing", {
        userId: socket.userId,
        chatListId,
      });
    });

    socket.on("stop_typing", ({ chatListId }) => {
      socket.to(`chat:${chatListId}`).emit("stop_typing", {
        userId: socket.userId,
      });
    });

    socket.on("chat_opened", async ({ chatListId }) => {
      if (!chatListId) return;
      await redisClient.set(`active_chat:${socket.userId}`, chatListId);
    });

    socket.on("mark_read", async ({ chatListId }) => {
      if (!chatListId) return;
      try {
        await redisClient.del(`unread:${socket.userId}:${chatListId}`);
      } catch (err) {
        console.error("Redis DEL failed", err.message);
      }

      await Message.update(
        { isRead: true },
        {
          where: {
            chatListId,
            senderId: { [Op.ne]: socket.userId },
          },
        }
      );
    });

    socket.on("add_reaction", async ({ messageId, reactionType }) => {
      try {
        if (!messageId || !reactionType) return;
        const userId = socket.userId;
        const existing = await Reaction.findOne({
          where: { messageId, userId },
        });
        let reaction;
        if (existing) {
          reaction = await existing.update({ reactionType });
        } else {
          reaction = await Reaction.create({
            messageId,
            userId,
            reactionType,
          });
        }

        const msg = await Message.findByPk(messageId);

        if (msg.groupId) {
          io.to(`group:${msg.groupId}`).emit("reaction_update", {
            messageId,
            userId,
            reactionType,
          });
        } else {
          io.to(`chat:${msg.chatListId}`).emit("reaction_update", {
            messageId,
            userId,
            reactionType,
          });
        }
      } catch (err) {
        console.error("reaction error:", err);
      }
    });

    socket.on("create_group", async ({ name, userIds }) => {
      const creatorId = socket.userId;
      if (!name || !userIds || !userIds.length) return;

      const t = await sequelize.transaction();
      try {
        const group = await ChatList.create(
          {
            name,
            type: "group",
          },
          {
            transaction: t,
          }
        );

        await ChatParticipant.create(
          {
            chatListId: group.id,
            userId: creatorId,
            isAdmin: true,
          },
          {
            transaction: t,
          }
        );

        for (const uid of userIds) {
          await ChatParticipant.create(
            {
              chatListId: group.id,
              userId: uid,
              isAdmin: false,
            },
            {
              transaction: t,
            }
          );
        }

        const systemMessage = await Message.create(
          {
            chatListId: group.id,
            senderId: creatorId,
            message: `You are added in this group`,
            type: "text",
          },
          {
            transaction: t,
          }
        );

        await ChatList.update(
          {
            lastMessageId: systemMessage.id,
          },
          {
            where: { id: group.id },
            transaction: t,
          }
        );

        await t.commit();

        const allUsers = [creatorId, ...userIds];

        for (const uid of allUsers) {
          io.to(`user:${uid}`).emit("group_created", {
            chatListId: group.id,
            name: group.name,
            message: systemMessage,
          });
        }
        console.log("aa gye yha");
      } catch (error) {
        await t.rollback();
        console.log(error);
      }
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

      await redisClient.del(`active_chat:${socket.userId}`);
      io.emit("stop_typing", {
        senderId: socket.userId,
      });

      console.log("User disconnected:", userId);
    });
  });
};
