const router = require("express").Router();
const Trip = require("../models/Trip");
const { requireAuth } = require("../middlewares/auth");
const {
  startTripSchema,
  locationUpdateSchema,
} = require("../utils/validators");
const notifQueue = require("../queues/notificationQueue");
const User = require("../models/User");

router.use(requireAuth);

// POST /api/trips/start
router.post("/start", async (req, res, next) => {
  try {
    const data = await startTripSchema.validateAsync(req.body);
    const trip = await Trip.create({ user: req.user._id, ...data });
    res.status(201).json({ ok: true, trip });
  } catch (err) {
    next(err);
  }
});


// PATCH /api/trips/:id/location
router.patch("/:id/location", async (req, res, next) => {
  try {
    const loc = await locationUpdateSchema.validateAsync(req.body);
    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "active",
    });
    if (!trip)
      return res
        .status(404)
        .json({ ok: false, message: "Trip not found or inactive" });

    trip.lastLocation = { lat: loc.lat, lng: loc.lng, ts: loc.ts };
    await trip.save();
    // realtime broadcast
    const io = req.app.get("io");
    io.to(`user:${req.user._id}`).emit("trip:update", {
      tripId: trip._id,
      lastLocation: trip.lastLocation,
    });

    // optionally enqueue job to check route deviation / notify watchers
    await notifQueue.add("trip_location", {
      userId: req.user._id,
      tripId: trip._id,
      location: trip.lastLocation,
    });

    res.json({ ok: true, trip });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id/complete
router.patch("/:id/complete", async (req, res) => {
  const trip = await Trip.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: "active",
  });
  if (!trip)
    return res
      .status(404)
      .json({ ok: false, message: "Trip not found or inactive" });
  trip.status = "completed";
  trip.endedAt = new Date();
  await trip.save();
  res.json({ ok: true, trip });
});

module.exports = router;
