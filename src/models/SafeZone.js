const mongoose = require("mongoose");

const SafeZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["police", "hospital", "public"],
      default: "public",
    },
    location: { lat: Number, lng: Number },
    city: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SafeZone", SafeZoneSchema);
