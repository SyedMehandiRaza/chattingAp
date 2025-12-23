const express = require("express");
const session = require("express-session");
const flash =  require("connect-flash");
const path = require("path");
const cookeParser = require("cookie-parser")
const authRoute = require("../src/routes/auth.route")
const chatRoute = require("../src/routes/chat.route")
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(cookeParser());


// Session + flash messages
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
// app.use("/chat", require("./routes/chatRoutes"));
// app.use("/group", require("./routes/groupRoutes"));
// app.use("/reaction", require("./routes/reactionRoutes"));
// app.use("/profile", require("./routes/profileRoutes"));

module.exports = app;