// const express = require("express");
// const session = require("express-session");
// const flash = require("connect-flash");
// const path = require("path");
// const cookieParser = require("cookie-parser");

// const authRoute = require("./routes/auth.route");
// const chatRoute = require("./routes/chat.route");

// const app = express();

// app.set("trust proxy", 1);

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(express.static("public"));
// app.use(cookieParser());

// // ✅ SESSION (FIXED)
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "none",
//     },
//   })
// );

// // flash AFTER session
// app.use(flash());

// // flash locals
// app.use((req, res, next) => {
//   res.locals.error = req.flash("error");
//   res.locals.success = req.flash("success");
//   next();
// });

// app.get("/", (req, res) => {
//   res.status(200).send("OK");
// });

// // routes
// app.use(authRoute);
// app.use(chatRoute);

// module.exports = app;





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


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
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
// app.use("/chat", require("./routes/chatRoutes"));
// app.use("/group", require("./routes/groupRoutes"));
// app.use("/reaction", require("./routes/reactionRoutes"));
// app.use("/profile", require("./routes/profileRoutes"));

module.exports = app;