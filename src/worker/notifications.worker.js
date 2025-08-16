// server/src/worker/notifications.worker.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const notifQueue = require("../queues/notificationQueue");
const nodemailer = require("nodemailer");
const webpush = require("web-push");
const Twilio = require("twilio");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const User = require("../models/User");
const Alert = require("../models/Alert");
const Trip = require("../models/Trip");
const { minDistToPathMeters } = require("../utils/geo");

// init services
const twilioClient = new Twilio(
  process.env.TWILIO_SID || "",
  process.env.TWILIO_TOKEN || ""
);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

webpush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT || "mailto:admin@example.com",
  process.env.VAPID_PUBLIC || "",
  process.env.VAPID_PRIVATE || ""
);

// DB
(async () => {
  if (process.env.MONGO_URI) await connectDB(process.env.MONGO_URI);

  // ---- sos_notify handler ----
  notifQueue.process("sos_notify", async (job) => {
    const { userId, userName, contacts, alert } = job.data;
    console.log("Worker: sos_notify for", userId, contacts.length);

    for (const c of contacts) {
      // SMS via Twilio
      if (c.phone && process.env.TWILIO_SID) {
        try {
          await twilioClient.messages.create({
            body: `SOS from ${userName}. Location: ${
              alert.lat && alert.lng
                ? `https://maps.google.com/?q=${alert.lat},${alert.lng}`
                : "unknown"
            }`,
            from: process.env.TWILIO_FROM,
            to: c.phone,
          });
        } catch (e) {
          console.error("Twilio error", e.message);
        }
      }
      // Email via SMTP
      if (c.email && process.env.SMTP_HOST) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: c.email,
            subject: `SOS: ${userName} needs help`,
            text: `SOS triggered by ${userName}. Location: ${
              alert.lat && alert.lng
                ? `https://maps.google.com/?q=${alert.lat},${alert.lng}`
                : "unknown"
            }`,
          });
        } catch (e) {
          console.error("Email error", e.message);
        }
      }
    }

    if (alert?.id) {
      await Alert.findByIdAndUpdate(alert.id, { delivered: true }).catch(() => {});
    }

    return Promise.resolve();
  });

  // ---- trip_location handler ----
  notifQueue.process("trip_location", async (job) => {
    const { tripId, location } = job.data;
    const trip = await Trip.findById(tripId);
    if (!trip || trip.status !== "active" || !trip.routePolyline) return;

    const threshold = trip.deviationThresholdMeters || 120;
    const dist = minDistToPathMeters(
      { lat: location.lat, lng: location.lng },
      trip.routePolyline
    );

    if (dist > threshold && !trip.routeDeviation) {
      trip.routeDeviation = true;
      await trip.save();

      // Create a DEVIATION alert
      const alert = await Alert.create({
        user: trip.user,
        trip: trip._id,
        type: "DEVIATION",
        location: { lat: location.lat, lng: location.lng },
        channel: "PUSH",
        meta: { deviationMeters: Math.round(dist) },
      });

      // Notify contacts via SOS flow
      const user = await User.findById(trip.user);
      const contacts = (user?.contacts || []).map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
      }));

      await notifQueue.add("sos_notify", {
        userId: user._id,
        userName: user.name,
        contacts,
        alert: { id: alert._id, lat: location.lat, lng: location.lng },
      });
    }

    return Promise.resolve();
  });

  console.log("Worker started and listening to notification queue");
})();
