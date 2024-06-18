const jwt = require("jsonwebtoken");
require("dotenv").config();

const ensureAuthenticated = (req, res, next) => {
  const token = req.cookies.access_token; // Extract the token from cookies

  if (!token) {
    return res.status(403).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user information to the request
    return next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token is not valid, or it's expired" });
  }
};

module.exports = {
  ensureAuthenticated,
};
