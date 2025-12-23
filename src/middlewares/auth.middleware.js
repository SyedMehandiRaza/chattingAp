const jwt = require("jsonwebtoken");
// module.exports = (req, res, next) => {
//   if (!req.session.user) {
//     return res.redirect("/login");
//   }
//   next();
// };

exports.isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.flash("error", "Please Login");
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("error in is LoggedIn middleware", error);
    req.flash("error", "Something went wrong");
  }
};
