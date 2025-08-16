const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
    type: {
      type: String,
      enum: ["SOS", "DEVIATION", "NO_MOVEMENT"],
      required: true,
    },
    location: { lat: Number, lng: Number },
    channel: { type: String, enum: ["PUSH", "SMS", "EMAIL"], default: "PUSH" },
    delivered: { type: Boolean, default: false },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
