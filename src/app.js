const express = require("express");
const session = require("express-session");
const flash =  require("connect-flash");
const path = require("path");
const cookieParser = require("cookie-parser")
const authRoute = require("../src/routes/auth.route")
const chatRoute = require("../src/routes/chat.route")
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "..", "public")));



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});


// ROUTES
app.use(authRoute);
app.use(chatRoute)

module.exports = app;