const express = require("express");
const { isLoggedIn } = require("../middlewares/auth.middleware");
const { groupController } = require("../controllers/group.controller")

const router = express.Router();

router.post("/create-group", isLoggedIn.isLoggedIn, groupController.createGroup);
router.get("/groups", isLoggedIn.isLoggedIn, groupController.getGroups)
router.get("/group/chat/:groupId", isLoggedIn.isLoggedIn, groupController.getGroupChatHistory)


module.exports = router;