// const { Message, sequelize } = require("../models");

// exports.createMessage = async ({ senderId, receiverId, message, type }) => {
//     if(!receiverId) return req.flash("error", "User Not found")
//     if(!message) return req.flash("error", "Empty message cant be sent")
        
//     if(message.type === "text" && message.length < 500){
//         return req.flash("error", "message can't be more than 500 words")
//     }
//     return await Message.create({
//     senderId,
//     receiverId,
//     message,
//     type: type || "text",
//     isRead: false,
//   });
// };

const { Op } = require("sequelize");
const { Message, ChatList, ChatParticipant } = require("../models");

exports.createMessage = async ({ senderId, receiverId, message, type }) => {
  if (!message) throw new Error("Empty message cannot be sent");

  let chatListId;

  if (receiverId) {
    // 1-to-1 chat: check if a ChatList exists
    let chat = await ChatList.findOne({
      where: { type: "private" },
      include: [{
        model: ChatParticipant,
        where: { userId: [senderId, receiverId] },
      }],
    });

    if (!chat) {
      // create new chatList for this conversation
      chat = await ChatList.create({ type: "private" });
      await ChatParticipant.bulkCreate([
        { chatListId: chat.id, userId: senderId, isAdmin: false, joinedAt: new Date() },
        { chatListId: chat.id, userId: receiverId, isAdmin: false, joinedAt: new Date() },
      ]);
    }

    chatListId = chat.id;
  }

  // create the message
  return await Message.create({
    senderId,
    chatListId,
    message,
    type: type || "text",
    isRead: false,
  });
};


// exports.markMessagesRead = async ({ senderId, receiverId }) => {
//   return await Message.update(
//     { isRead: true },
//     { where: { senderId, receiverId, isRead: false } }
//   );
// };

exports.markMessagesRead = async ({ chatListId, userId }) => {
  return await Message.update(
    { isRead: true },
    { 
      where: { 
        chatListId,
        senderId: { [Op.ne]: userId }, 
        isRead: false 
      } 
    }
  );
};


// exports.getUnreadCounts = async (userId, sequelize) => {
//   return await Message.findAll({
//     where: { receiverId: userId, isRead: false },
//     attributes: [
//       "senderId",
//       [sequelize.fn("COUNT", sequelize.col("id")), "count"],
//     ],
//     group: ["senderId"],
//     raw: true,
//   });
// };

exports.getUnreadCounts = async (userId, sequelize) => {
  return await Message.findAll({
    where: { 
      isRead: false,
    },
    include: [{
      model: ChatParticipant,
      where: { userId },
      attributes: []
    }],
    attributes: [
      "chatListId",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["chatListId"],
    raw: true,
  });
};
