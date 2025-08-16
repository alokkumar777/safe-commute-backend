require("dotenv").config();
const { connectDB } = require("../config/db");
const Helpline = require("../models/Helpline");
const SafeZone = require("../models/SafeZone");

async function run() {
  await connectDB(process.env.MONGO_URI);

  const helplines = [
    { country: "IN", name: "Emergency", number: "112", category: "emergency" },
    {
      country: "IN",
      name: "Women Helpline",
      number: "1091",
      category: "women",
    },
    { country: "IN", name: "Police", number: "100", category: "police" },
    { country: "IN", name: "Ambulance", number: "102", category: "ambulance" },
    {
      country: "IN",
      name: "Child Helpline",
      number: "1098",
      category: "child",
    },
  ];

  const zones = [
    {
      name: "Police Station (Example)",
      type: "police",
      location: { lat: 28.6139, lng: 77.209 },
      city: "Delhi",
    },
    {
      name: "City Hospital (Example)",
      type: "hospital",
      location: { lat: 19.076, lng: 72.8777 },
      city: "Mumbai",
    },
  ];

  await Helpline.deleteMany({ country: "IN" });
  await Helpline.insertMany(helplines);
  await SafeZone.deleteMany({ city: { $in: ["Delhi", "Mumbai"] } });
  await SafeZone.insertMany(zones);

  console.log("Seeded helplines & safe zones");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
