const redisClient = require("../config/redis");
const {
  User,
  Message,
  Reaction,
  ChatList,
  ChatParticipant,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

exports.searchUsers = async (req, res) => {
  console.log("inside search");
  
  const myId = req.user.id;
  const { q } = req.query;

  if (!q || q.trim().length < 2) return res.json([]);

  const users = await User.findAll({
    where: {
      id: { [Op.ne]: myId },
      name: { [Op.like]: `%${q}%` },
    },
    attributes: ["id", "name", "profilePic"],
    limit: 20,
  });

  res.json(users);
};

// exports.startChat = async (req, res) => {
//   const myId = req.user.id;
//   const { userId } = req.body;

//   const t = await sequelize.transaction();

//   try {
//     if (!userId) {
//       return res.status(400).json({ message: "User required" });
//     }
//     const chats = await ChatParticipant.findAll({
//       where: { userId: myId },
//       include: [
//         {
//           model: ChatList,
//           as: "ChatList",
//           where: { type: "private" },
//           include: [
//             {
//               model: ChatParticipant,
//               as: "participants",
//               where: { userId },
//             },
//           ],
//         },
//       ],
//     });

//     let chat = chats.length ? chats[0].ChatList : null;

//     if (!chat) {
//       chat = await ChatList.create({ type: "private" }, { transaction: t });

//       await ChatParticipant.bulkCreate(
//         [
//           { chatListId: chat.id, userId: myId },
//           { chatListId: chat.id, userId },
//         ],
//         { transaction: t }
//       );
//     }

//     await t.commit();

//     const otherUser = await User.findByPk(userId, {
//       attributes: ["id", "name", "profilePic"],
//     });

//     return res.json({
//       chatListId: chat.id,
//       user: otherUser,
//     });
//   } catch (error) {
//     await t.rollback();
//     console.log(error);
//   }
// };

exports.startChat = async (req, res) => {
  const myId = req.user.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User required" });
  }

  const chat = await ChatList.findOne({
    where: { type: "private" },
    include: [{
      model: ChatParticipant,
      as: "participants",
      where: { userId: { [Op.in]: [myId, userId] } },
    }],
  });

  if (!chat) {
    return res.json({
      chatListId: null,
      user: await User.findByPk(userId, {
        attributes: ["id", "name", "profilePic"],
      }),
    });
  }

  return res.json({
    chatListId: chat.id,
    user: await User.findByPk(userId, {
      attributes: ["id", "name", "profilePic"],
    }),
  });
};

exports.sendMessage = async (req, res) => {
  const { receiverId, message, type } = req.body;
  const senderId = req.user.id;

  const chat = await getOrCreatePrivateChat(senderId, receiverId);

  const msg = await Message.create({
    chatListId: chat.id,
    senderId,
    message,
    type: type || "text",
  });

  res.json(msg);
};

async function getSidebarUsers(currentUserId) {
  
  const chatLists = await ChatList.findAll({
  include: [
    {
      model: ChatParticipant,
      as: "participants",
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "profilePic", "onlineStatus", "lastSeen"]
        }
      ]
    },
    {
      model: Message,
      as: "lastMessage",
      attributes: ["message", "type", "senderId", "createdAt"]
    }
  ],
  where: {
    id: {
      [Op.in]: sequelize.literal(`
        (SELECT chatListId FROM ChatParticipants WHERE userId = ${currentUserId})
      `)
    }
  },
  order: [[{ model: Message, as: "lastMessage" }, "createdAt", "DESC"]],
  distinct: true
});

  const redisKeys = await redisClient.keys(`unread:${currentUserId}:*`);
  const unreadMap = {};
  for (const key of redisKeys) {
    const count = await redisClient.get(key);
    const chatId = key.split(":")[2];
    unreadMap[chatId] = Number(count);
  }

  
  const sidebar = chatLists.map((chat) => {
    const isGroup = chat.type === "group";

    let name = chat.name || "Unnamed Group";
    let profilePic = null;
    let userId;

    if (!isGroup) {
      const other = chat.participants
        .map((p) => p.User)
        .find((u) => u && u.id !== currentUserId);
        console.log("other people not groups: ++++++++++++++++++++++++++++++++++",other)

      name = other?.name || "Unknown";
      profilePic = other?.profilePic || null;
      userId = other?.id
    }

    return {
      userId,
      chatListId: chat.id,
      chatType: chat.type,
      name,
      profilePic,
      lastMessage: chat.lastMessage || null,
      unreadCount: unreadMap[chat.id] || 0,
    };
  });

  return sidebar;
}

exports.editChat = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { newMessage } = req.body;

    if (!newMessage || newMessage.trim() === "") {
      req.flash("error", "Message can not be empty");
      return res.redirect("back");
    }

    const msg = await Message.findByPk(messageId);

    if (!msg) {
      req.flash("error", "Message not found");
      return res.redirect("back");
    }

    if (msg.senderId !== userId) {
      req.flash("error", "only sender can edit msg");
      return res.redirect("back");
    }

    if (msg.isDeleted) {
      req.flash("error", "cant edit deleted msg");
      return res.redirect("back");
    }

    await Message.update(
      {
        message: newMessage,
        isEdited: true,
      },
      {
        where: { id: messageId },
      }
    );
    req.flash("success", "Message Editted");
    return res.redirect("back");
  } catch (error) {
    console.error("error in message edit controller", error);
    req.flash("error", "Something went wrong");
  }
};

exports.deleteChat = async (req, res) => {
  try {
    console.log("inside chat");

    const { messageId } = req.params;
    const userId = req.user.id;
    const msg = await Message.findByPk(messageId);

    if (!msg) {
      req.flash("error", "Message not found");
      return res.redirect("back");
    }

    if (msg.isDeleted) {
      req.flash("error", "messaeg already deleted");
      return res.redirect("back");
    }
    if (msg.senderId !== userId) {
      req.flash("error", "Message can be deleted by sender only");
      return res.redirect("back");
    }

    await Message.update(
      {
        isDeleted: true,
      },
      {
        where: { id: messageId },
      }
    );
    req.flash("success", "message is deleted successfully");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong");
  }
};

exports.renderChats = async (req, res) => {
  try {
    const myId = req.user.id;
    console.log(req.user);

    const allUsers = await User.findAll({
      where: { id: { [Op.ne]: myId } },
      raw: true,
    });

    const users = await getSidebarUsers(myId);
    console.log("users from render chats: <+==============-----*****-----===============+>",users);

    res.render("chat/chat.ejs", {
      users,
      user: req.user,
      name: req.user.email,
    });
  } catch (error) {
    console.log(error, "error in render chats");
    req.flash("error", "Something went wrong");
    res.redirect("back");
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const myId = req.user.id;
    const { chatListId } = req.params;
    const limit = 12;
    const before = req.query.before;
    if (!chatListId) {
      return res.status(400).json({ message: "chatListId is required" });
    }

    // SECURITY: verify user belongs to chat
    const isParticipant = await ChatParticipant.findOne({
      where: { chatListId, userId: myId },
    });

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const where = { chatListId };
    if (before) where.createdAt = { [Op.lt]: new Date(before) };

    const messages = await Message.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      include: [
        { model: Reaction, as: "Reactions" },
        { model: User, as: "sender", attributes: ["id", "name", "profilePic"] },
      ],
    });

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load chat" });
  }
};

exports.getUserStatus = async (req, res) => {
  const user = await User.findByPk(req.params.userId, {
    attributes: ["onlineStatus", "lastSeen"],
  });
  res.json(user);
};

exports.getChatInfo = async (req, res) => {
  const myId = req.user.id;
  const { chatListId } = req.params;

  const participant = await ChatParticipant.findOne({
    where: { chatListId, userId: myId },
  });

  if (!participant) {
    return res.status(403).json({ message: "Access denied" });
  }

  const other = await ChatParticipant.findOne({
    where: {
      chatListId,
      userId: { [Op.ne]: myId },
    },
    include: [
      {
        model: User,
        attributes: ["id", "name", "profilePic"],
      },
    ],
  });

  res.json({
    chatListId,
    user: {
      id: other.User.id,
      name: other.User.name,
      profilePic: other.User.profilePic,
    },
  });
};































// const redisClient = require("../config/redis");
// const {
//   User,
//   Message,
//   Reaction,
//   ChatList,
//   ChatParticipant,
//   sequelize,
// } = require("../models");
// const { Op } = require("sequelize");

// exports.searchUsers = async (req, res) => {
//   const myId = req.user.id;
//   const { q } = req.query;

//   if (!q || q.trim().length < 2) return res.json([]);

//   const users = await User.findAll({
//     where: {
//       id: { [Op.ne]: myId },
//       name: { [Op.like]: `%${q}%` },
//     },
//     attributes: ["id", "name", "profilePic"],
//     limit: 20,
//   });

//   res.json(users);
// };

// exports.startChat = async (req, res) => {
//   const myId = req.user.id;
//   const { userId } = req.body;

//   const t = await sequelize.transaction();

//   try {
//     if (!userId) {
//       return res.status(400).json({ message: "User required" });
//     }
//     const chats = await ChatParticipant.findAll({
//       where: { userId: myId },
//       include: [
//         {
//           model: ChatList,
//           as: "ChatList",
//           where: { type: "private" },
//           include: [
//             {
//               model: ChatParticipant,
//               as: "participants",
//               where: { userId },
//             },
//           ],
//         },
//       ],
//     });

//     let chat = chats.length ? chats[0].ChatList : null;

//     if (!chat) {
//       chat = await ChatList.create({ type: "private" }, { transaction: t });

//       await ChatParticipant.bulkCreate(
//         [
//           { chatListId: chat.id, userId: myId },
//           { chatListId: chat.id, userId },
//         ],
//         { transaction: t }
//       );
//     }

//     await t.commit();

//     const otherUser = await User.findByPk(userId, {
//       attributes: ["id", "name", "profilePic"],
//     });

//     return res.json({
//       chatListId: chat.id,
//       user: otherUser,
//     });
//   } catch (error) {
//     await t.rollback();
//     console.log(error);
//   }
// };

// exports.sendMessage = async (req, res) => {
//   const { receiverId, message, type } = req.body;
//   const senderId = req.user.id;

//   const chat = await getOrCreatePrivateChat(senderId, receiverId);

//   const msg = await Message.create({
//     chatListId: chat.id,
//     senderId,
//     message,
//     type: type || "text",
//   });

//   res.json(msg);
// };

// async function getSidebarUsers(currentUserId) {
  
//   const chatLists = await ChatList.findAll({
//   include: [
//     {
//       model: ChatParticipant,
//       as: "participants",
//       include: [
//         {
//           model: User,
//           as: "User",
//           attributes: ["id", "name", "profilePic", "onlineStatus", "lastSeen"]
//         }
//       ]
//     },
//     {
//       model: Message,
//       as: "lastMessage",
//       attributes: ["message", "type", "senderId", "createdAt"]
//     }
//   ],
//   where: {
//     id: {
//       [Op.in]: sequelize.literal(`
//         (SELECT chatListId FROM ChatParticipants WHERE userId = ${currentUserId})
//       `)
//     }
//   },
//   order: [[{ model: Message, as: "lastMessage" }, "createdAt", "DESC"]],
//   distinct: true
// });

//   const redisKeys = await redisClient.keys(`unread:${currentUserId}:*`);
//   const unreadMap = {};
//   for (const key of redisKeys) {
//     const count = await redisClient.get(key);
//     const chatId = key.split(":")[2];
//     unreadMap[chatId] = Number(count);
//   }

  
//   const sidebar = chatLists.map((chat) => {
//     const isGroup = chat.type === "group";

//     let name = chat.name || "Unnamed Group";
//     let profilePic = null;
//     let userId;

//     if (!isGroup) {
//       const other = chat.participants
//         .map((p) => p.User)
//         .find((u) => u && u.id !== currentUserId);
//         console.log("other people not groups: ++++++++++++++++++++++++++++++++++",other)

//       name = other?.name || "Unknown";
//       profilePic = other?.profilePic || null;
//       userId = other?.id
//     }

//     return {
//       userId,
//       chatListId: chat.id,
//       chatType: chat.type,
//       name,
//       profilePic,
//       lastMessage: chat.lastMessage || null,
//       unreadCount: unreadMap[chat.id] || 0,
//     };
//   });

//   return sidebar;
// }

// exports.editChat = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const userId = req.user.id;
//     const { newMessage } = req.body;

//     if (!newMessage || newMessage.trim() === "") {
//       req.flash("error", "Message can not be empty");
//       return res.redirect("back");
//     }

//     const msg = await Message.findByPk(messageId);

//     if (!msg) {
//       req.flash("error", "Message not found");
//       return res.redirect("back");
//     }

//     if (msg.senderId !== userId) {
//       req.flash("error", "only sender can edit msg");
//       return res.redirect("back");
//     }

//     if (msg.isDeleted) {
//       req.flash("error", "cant edit deleted msg");
//       return res.redirect("back");
//     }

//     await Message.update(
//       {
//         message: newMessage,
//         isEdited: true,
//       },
//       {
//         where: { id: messageId },
//       }
//     );
//     req.flash("success", "Message Editted");
//     return res.redirect("back");
//   } catch (error) {
//     console.error("error in message edit controller", error);
//     req.flash("error", "Something went wrong");
//   }
// };

// exports.deleteChat = async (req, res) => {
//   try {
//     console.log("inside chat");

//     const { messageId } = req.params;
//     const userId = req.user.id;
//     const msg = await Message.findByPk(messageId);

//     if (!msg) {
//       req.flash("error", "Message not found");
//       return res.redirect("back");
//     }

//     if (msg.isDeleted) {
//       req.flash("error", "messaeg already deleted");
//       return res.redirect("back");
//     }
//     if (msg.senderId !== userId) {
//       req.flash("error", "Message can be deleted by sender only");
//       return res.redirect("back");
//     }

//     await Message.update(
//       {
//         isDeleted: true,
//       },
//       {
//         where: { id: messageId },
//       }
//     );
//     req.flash("success", "message is deleted successfully");
//     return res.redirect("back");
//   } catch (error) {
//     console.error(error);
//     req.flash("error", "Something went wrong");
//   }
// };

// exports.renderChats = async (req, res) => {
//   try {
//     const myId = req.user.id;
//     console.log(req.user);

//     const allUsers = await User.findAll({
//       where: { id: { [Op.ne]: myId } },
//       raw: true,
//     });

//     const users = await getSidebarUsers(myId);
//     console.log("users from render chats: <+==============-----*****-----===============+>",users);

//     res.render("chat/chat.ejs", {
//       users,
//       user: req.user,
//       name: req.user.email,
//     });
//   } catch (error) {
//     console.log(error, "error in render chats");
//     req.flash("error", "Something went wrong");
//     res.redirect("back");
//   }
// };

// exports.getChatHistory = async (req, res) => {
//   try {
//     const myId = req.user.id;
//     const { chatListId } = req.params;
//     const limit = 12;
//     const before = req.query.before;
//     if (!chatListId) {
//       return res.status(400).json({ message: "chatListId is required" });
//     }

//     // SECURITY: verify user belongs to chat
//     const isParticipant = await ChatParticipant.findOne({
//       where: { chatListId, userId: myId },
//     });

//     if (!isParticipant) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const where = { chatListId };
//     if (before) where.createdAt = { [Op.lt]: new Date(before) };

//     const messages = await Message.findAll({
//       where,
//       order: [["createdAt", "DESC"]],
//       limit,
//       include: [
//         { model: Reaction, as: "Reactions" },
//         { model: User, as: "sender", attributes: ["id", "name", "profilePic"] },
//       ],
//     });

//     res.json({
//       messages: messages.reverse(),
//       hasMore: messages.length === limit,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to load chat" });
//   }
// };

// exports.getUserStatus = async (req, res) => {
//   const user = await User.findByPk(req.params.userId, {
//     attributes: ["onlineStatus", "lastSeen"],
//   });
//   res.json(user);
// };

// exports.getChatInfo = async (req, res) => {
//   const myId = req.user.id;
//   const { chatListId } = req.params;

//   const participant = await ChatParticipant.findOne({
//     where: { chatListId, userId: myId },
//   });

//   if (!participant) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   const other = await ChatParticipant.findOne({
//     where: {
//       chatListId,
//       userId: { [Op.ne]: myId },
//     },
//     include: [
//       {
//         model: User,
//         attributes: ["id", "name", "profilePic"],
//       },
//     ],
//   });

//   res.json({
//     chatListId,
//     user: {
//       id: other.User.id,
//       name: other.User.name,
//       profilePic: other.User.profilePic,
//     },
//   });
// };
