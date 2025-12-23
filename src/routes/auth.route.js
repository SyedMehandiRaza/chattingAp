const express = require("express");
const authController = require("../controllers/auth.controller")
const router = express.Router();

router.get('/login', authController.renderLogin);
router.get('/signup',authController.renderSignup)

router.post('/login', authController.loginController)
router.post('/signup', authController.signupController)
router.post('/logout', authController.logoutController)


module.exports = router;