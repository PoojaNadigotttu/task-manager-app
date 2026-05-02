const jwt = require("jsonwebtoken");

// AUTH CHECK
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
}

// ADMIN CHECK
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Admin access only" });
  }
  next();
}

module.exports = auth;
module.exports.isAdmin = isAdmin;