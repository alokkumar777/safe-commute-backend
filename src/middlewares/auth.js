const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { sub: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
      return res.status(401).json({ ok: false, message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select(
      "_id name email contacts settings"
    );
    if (!user)
      return res.status(401).json({ ok: false, message: "Invalid token" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
}

module.exports = { signToken, requireAuth };
