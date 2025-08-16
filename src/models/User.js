const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const TrustedContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, trim: true },
    email: { type: String, trim: true },
    preferred: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    contacts: [TrustedContactSchema],
    settings: {
      offlineSmsFallback: { type: Boolean, default: true },
      autoShareOnTrip: { type: Boolean, default: true },
      voiceTriggerEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
