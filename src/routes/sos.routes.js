// server/src/routes/sos.routes.js (modified)
const router = require("express").Router();
const Alert = require("../models/Alert");
const { requireAuth } = require("../middlewares/auth");
const notifQueue = require("../queues/notificationQueue");
const User = require("../models/User");

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { lat, lng, tripId } = req.body || {};
    const alert = await Alert.create({
      user: req.user._id,
      trip: tripId || null,
      type: "SOS",
      location: lat && lng ? { lat, lng } : undefined,
      channel: "PUSH",
      meta: { contactsCount: (req.user.contacts || []).length },
    });

    // Quick realtime broadcast to user's sockets (so their devices see it)
    const io = req.app.get("io");
    io.to(`user:${req.user._id}`).emit("alert", {
      type: "SOS",
      alertId: alert._id,
      lat,
      lng,
      ts: alert.createdAt,
    });

    // Add job to notification queue to notify all trusted contacts
    const contacts = (req.user.contacts || []).map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
    }));
    await notifQueue.add("sos_notify", {
      userId: req.user._id,
      userName: req.user.name,
      contacts,
      alert: { id: alert._id, lat, lng },
    });

    res
      .status(201)
      .json({ ok: true, alertId: alert._id, message: "SOS triggered" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
