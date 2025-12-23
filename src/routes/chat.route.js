const express = require("express");
const chatController = require("../controllers/message.controller")
const isLoggedIn = require("../middlewares/auth.middleware")
const router = express.Router();

router.get("/chat", isLoggedIn.isLoggedIn, chatController.renderChats)
router.get("/chat/history/:receiverId", isLoggedIn.isLoggedIn, chatController.getChatHistory)
router.post("/message/:messageId/edit", isLoggedIn.isLoggedIn, chatController.editChat)
router.post("/message/:messageId/delete", isLoggedIn.isLoggedIn, chatController.deleteChat)
router.post("/chat/mark-read/:userId", isLoggedIn.isLoggedIn, chatController.markAsRead)
router.get("/user/status/:userId", isLoggedIn.isLoggedIn, chatController.getUserStatus);


module.exports = router;