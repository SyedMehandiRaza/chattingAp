const express = require("express")
// const express = require("express");
const chatController = require("../controllers/message.controller")
const isLoggedIn = require("../middlewares/auth.middleware");
const { Op } = require("sequelize");
const validate = require("../middlewares/validate.middleware");
const { startChatSchema, chatIdParamSchema, editMessageSchema } = require("../validators/chat.validator");
// const router = express.Router();
const router = express.Router();

router.post("/chat/start", isLoggedIn.isLoggedIn, validate(startChatSchema), chatController.startChat);
router.get("/chat", isLoggedIn.isLoggedIn, chatController.renderChats)
router.get("/chat/history/:chatListId", isLoggedIn.isLoggedIn, validate(chatIdParamSchema), chatController.getChatHistory)
router.post("/message/:messageId/edit", isLoggedIn.isLoggedIn, validate(editMessageSchema), chatController.editChat)
router.post("/message/:messageId/delete", isLoggedIn.isLoggedIn, chatController.deleteChat)
router.get("/user/status/:userId", isLoggedIn.isLoggedIn, chatController.getUserStatus);
router.get("/chat/search", isLoggedIn.isLoggedIn, chatController.searchUsers);
router.get("/chat/info/:chatListId", isLoggedIn.isLoggedIn, chatController.getChatInfo);

module.exports = router;