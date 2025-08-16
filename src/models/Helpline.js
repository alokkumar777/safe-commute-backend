const mongoose = require("mongoose");

const HelplineSchema = new mongoose.Schema(
  {
    country: { type: String, default: "IN", index: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    category: {
      type: String,
      enum: ["emergency", "women", "police", "ambulance", "child"],
      default: "emergency",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Helpline", HelplineSchema);
