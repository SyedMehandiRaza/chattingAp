const Joi = require("joi");

exports.startChatSchema = Joi.object({
  userId: Joi.number().integer().required(),
});

exports.sendMessageSchema = Joi.object({
  receiverId: Joi.number().integer().required(),
  message: Joi.string().min(1).required(),
  type: Joi.string().valid("text", "image", "video", "audio", "file").optional(),
});

exports.editMessageSchema = Joi.object({
  newMessage: Joi.string().min(1).required(),
});

exports.chatIdParamSchema = Joi.object({
  chatListId: Joi.number().integer().required(),
});
