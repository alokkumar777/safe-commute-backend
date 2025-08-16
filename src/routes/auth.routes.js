const router = require("express").Router();
const User = require("../models/User");
const { signToken } = require("../middlewares/auth");
const { registerSchema, loginSchema } = require("../utils/validators");

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const data = await registerSchema.validateAsync(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists)
      return res
        .status(409)
        .json({ ok: false, message: "Email already in use" });

    const user = await User.create(data);
    const token = signToken(user);
    res.status(201).json({
      ok: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = await loginSchema.validateAsync(req.body);
    const user = await User.findOne({ email }).select(
      "+password name email contacts settings"
    );
    if (!user)
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });

    const token = signToken(user);
    res.json({
      ok: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contacts: user.contacts,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
