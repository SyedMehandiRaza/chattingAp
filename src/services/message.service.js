const { Message, sequelize } = require("../models");

exports.createMessage = async ({ senderId, receiverId, message, type }) => {
    if(!receiverId) return req.flash("error", "User Not found")
    if(!message) return req.flash("error", "Empty message cant be sent")
        
    if(message.type === "text" && message.length < 500){
        return req.flash("error", "message can't be more than 500 words")
    }
    return await Message.create({
    senderId,
    receiverId,
    message,
    type: type || "text",
    isRead: false,
  });
};

exports.markMessagesRead = async ({ senderId, receiverId }) => {
  return await Message.update(
    { isRead: true },
    { where: { senderId, receiverId, isRead: false } }
  );
};

exports.getUnreadCounts = async (userId, sequelize) => {
  return await Message.findAll({
    where: { receiverId: userId, isRead: false },
    attributes: [
      "senderId",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["senderId"],
    raw: true,
  });
};