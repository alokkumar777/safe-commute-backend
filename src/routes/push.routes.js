const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth");
const User = require("../models/User");
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT || "mailto:admin@example.com",
  process.env.VAPID_PUBLIC || "",
  process.env.VAPID_PRIVATE || ""
);

// POST /api/push/subscribe
router.post("/subscribe", requireAuth, async (req, res, next) => {
  try {
    const sub = req.body; // { endpoint, keys: {p256dh, auth} }
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid subscription" });
    }
    // dedupe by endpoint
    await User.updateOne(
      {
        _id: req.user._id,
        "pushSubscriptions.endpoint": { $ne: sub.endpoint },
      },
      {
        $push: {
          pushSubscriptions: {
            ...sub,
            userAgent: req.headers["user-agent"] || "",
          },
        },
      }
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/push/unsubscribe
router.post("/unsubscribe", requireAuth, async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint)
      return res.status(400).json({ ok: false, message: "Missing endpoint" });
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { pushSubscriptions: { endpoint } } }
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/push/test  (send a test notification to all subs)
router.post("/test", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "pushSubscriptions name"
    );
    const subs = user.pushSubscriptions || [];
    const payload = JSON.stringify({
      t: "TEST",
      title: "Safe Commute",
      body: "Push is working 🎉",
      url: "/",
    });

    let sent = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s, payload);
          sent++;
        } catch {
          /* ignore failed endpoints */
        }
      })
    );

    res.json({ ok: true, sent, total: subs.length });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
