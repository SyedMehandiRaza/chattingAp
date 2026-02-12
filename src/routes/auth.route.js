const express = require("express");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { loginSchema, signupSchema } = require("../validators/auth.validator");
const router = express.Router();

router.get('/login', authController.renderLogin);
router.get('/signup',authController.renderSignup)

router.post('/login', validate(loginSchema), authController.loginController)
router.post('/signup', validate(signupSchema), authController.signupController)
router.post('/logout', authController.logoutController)


module.exports = router;