const { User } = require("../models");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.renderLogin = (req, res) => {
    return res.render("auth/layout/login.ejs")
} 

exports.renderSignup = (req, res) => {
    return res.render("auth/layout/signup.ejs")
}

exports.loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      req.flash("error", "Invalid Credentials");
      return res.redirect("/login");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash("error", "Invalid Credentials");
      return res.redirect("/login");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, 
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    req.flash("success", "Login Successfully");
    return res.redirect("/chat");

  } catch (error) {
    console.log("Login Controller Error:", error);
    req.flash("error", "Internal server error");
    return res.redirect("/login");
  }
};


exports.signupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    console.log(existingUser);
    if (existingUser) {
      req.flash("error", "Email already exists");
      return res.redirect("/signup");
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPass
    });
    console.log(user);
    

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, 
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.flash("success", "Signup successful");
    return res.redirect("/chat");

  } catch (error) {
    console.log(error);
    req.flash("error", "Something went wrong");
    return res.redirect("/signup");
  }
};

exports.logoutController = (req, res) => {
  res.clearCookie("token"); 
  req.flash("success", "Logged out successfully");
  return res.redirect("/login");
};
