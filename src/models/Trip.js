const mongoose = require("mongoose");

const TripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    origin: {
      lat: Number,
      lng: Number,
      label: String,
    },
    destination: {
      lat: Number,
      lng: Number,
      label: String,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed", "aborted"],
      default: "active",
      index: true,
    },
    lastLocation: {
      lat: Number,
      lng: Number,
      ts: { type: Date, default: Date.now },
    },
    routeDeviation: { type: Boolean, default: false },
    sharedWith: [{ name: String, phone: String, email: String }],
    routePolyline: { type: String }, // Google overview polyline
    deviationThresholdMeters: { type: Number, default: 120 }, // tolerance
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", TripSchema);
  