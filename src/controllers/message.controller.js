const { User, Message } = require("../models");
const { Op } = require("sequelize");

exports.chatPage = async (req, res) => {
  const users = await User.findAll({
    where: { id: { [Op.ne]: req.session.user.id } },
  });

  res.render("chat", { users });
};

exports.markAsRead = async (req, res) => {
  console.log('inside markasread -------------------------------------- ');
  
  const { userId } = req.params;
  const myId = req.user.id;

  await Message.update(
    { isRead: true },
    {
      where: {
        senderId: userId,
        receiverId: myId,
        isRead: false,
      },
    }
  );

  res.json({ success: true });
};

exports.chatList = async (req, res) => {
  const myId = req.session.user.id;

  const users = await User.findAll({
    where: { id: { [Op.ne]: myId } },
  });

  let finalList = [];

  for (let u of users) {
    const lastMsg = await Message.findOne({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: u.id },
          { senderId: u.id, receiverId: myId },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    const unreadCount = await Message.count({
      where: {
        senderId: u.id,
        receiverId: myId,
        isRead: false,
      },
    });

    finalList.push({
      user: u,
      lastMessage: lastMsg ? lastMsg.message : "",
      unreadCount,
    });
  }

  res.json(finalList);
};

exports.chatList = async (req, res) => {
  try {
    const myId = req.user.id; // read from JWT

    // Get all other users
    const users = await User.findAll({
      where: { id: { [Op.ne]: myId } },
      raw: true,
    });

    const userIds = users.map((u) => u.id);

    if (userIds.length === 0) return res.json([]);

    // Get all last messages between myId and all users
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: myId, receiverId: userIds },
          { senderId: userIds, receiverId: myId },
        ],
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // group messages user-wise
    const lastMessageMap = {};
    for (let msg of messages) {
      const chatPartner = msg.senderId === myId ? msg.receiverId : msg.senderId;

      if (!lastMessageMap[chatPartner]) {
        lastMessageMap[chatPartner] = msg;
      }
    }

    // Get unread message counts for all users
    const unreadCounts = await Message.findAll({
      where: {
        senderId: userIds,
        receiverId: myId,
        isRead: false,
      },
      attributes: ["senderId", [Sequelize.fn("COUNT", "senderId"), "count"]],
      group: ["senderId"],
      raw: true,
    });

    const unreadMap = {};
    unreadCounts.forEach((u) => {
      unreadMap[u.senderId] = u.count;
    });

    // Build final list
    const finalList = users.map((u) => ({
      user: u,
      lastMessage: lastMessageMap[u.id]?.message || "",
      unreadCount: unreadMap[u.id] || 0,
    }));

    res.json(finalList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.editChat = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { newMessage } = req.body;

    if (!newMessage || newMessage.trim() === "") {
      req.flash("error", "Message can not be empty");
      return rew.redirect("back");
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

    await Message.update({
      message: newMessage,
      isEdited: true,
    },
    {
      where: { id: messageId }
    });
    req.flash("success", "Message Editted");
    return res.redirect("back");
  } catch (error) {
    console.error("error in message edit controller", error);
    req.flash("error", "Something went wrong");
  }
};

exports.deleteChat = async (req, res) => {
  try {
    console.log('inside chat');
    
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

    const deleteChat = await Message.update({
      message: "this message is deleted",
      isDeleted: true,
    },
    {
      where: { id: messageId }
    });
    console.log("deleteChat ----------------- ",deleteChat);
    

    req.flash("success", "message is deleted successfully");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong");
  }
};

exports.renderChats = async (req, res) => {
  const myId = req.user.id; 
  // console.log("my id ------------------------>",myId);
  
  const users = await User.findAll({
    where: { id: { [Op.ne]: myId } },
    raw: true,
  });
  res.render("chat/chat.ejs", { users, user: req.user });
};

exports.getChatHistory = async (req, res) => {
  try {
    const myId = req.user.id;
    const { receiverId } = req.params;
    const limit = 12;

    const before = req.query.before;

    const where = {
      [Op.or]: [
        { senderId: myId, receiverId },
        { senderId: receiverId, receiverId: myId },
      ],
    };

    if (before) {
      where.createdAt = { [Op.lt]: new Date(before) }; 
    }

    const messages = await Message.findAll({
      where,
      order: [["createdAt", "DESC"]], 
      limit,
      raw: true,
    });

    console.log(messages,'pag------------------------------------------------->');

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Failed to load chat history" });
  }
};

// exports.getChatHistory = async (req, res) => {
//   try {
//     const myId = req.user.id;
//     const { receiverId } = req.params;

//     const messages = await Message.findAll({
//       where: {
//         [Op.or]: [
//           { senderId: myId, receiverId },
//           { senderId: receiverId, receiverId: myId },
//         ],
//       },
//       order: [["createdAt", "ASC"]],
//       raw: true,
//     });

//     res.json(messages);
//   } catch (error) {
//     console.error("Error fetching chat history:", error);
//     res.status(500).json({ message: "Failed to load chat history" });
//   }
// };

exports.getUserStatus = async (req, res) => {
  const user = await User.findByPk(req.params.userId, {
    attributes: ["onlineStatus", "lastSeen"]
  });
  res.json(user);
};