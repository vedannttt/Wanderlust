const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => { console.log("connected to DB"); })
  .catch((err) => { console.log(err); process.exit(1); });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDb = async () => {
  // ── 1. Create or find a demo host user ──────────────────────────────────────
  let demoUser = await User.findOne({ username: "wanderlust_admin" });

  if (!demoUser) {
    demoUser = new User({
      email: "admin@wanderlust.com",
      username: "wanderlust_admin",
    });
    // Register with passport-local-mongoose (hashes password automatically)
    await User.register(demoUser, "Admin@1234");
    console.log("✅ Demo host user created  → username: wanderlust_admin  password: Admin@1234");
  } else {
    console.log("ℹ️  Demo host user already exists:", demoUser.username);
  }

  // ── 2. Clear old listings and re-seed ────────────────────────────────────────
  await Listing.deleteMany({});

  const dataWithOwner = initData.map((obj) => ({
    ...obj,
    owner: demoUser._id,   // real ObjectId that exists in User collection
  }));

  await Listing.insertMany(dataWithOwner);
  console.log(`✅ Database seeded with ${dataWithOwner.length} listings (owner: ${demoUser.username}).`);

  mongoose.connection.close();
};

initDb();
