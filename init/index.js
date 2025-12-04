const mongoose = require("mongoose");
const initData = require("./data.js");  // this is an array
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDb = async () => {
  await Listing.deleteMany({});

  // Add owner field to each object
  const updatedData = initData.map((obj) => ({
    ...obj,
    owner: "68c43b7aa0ecdbf30474887d", // dummy user ID
  }));

  // Transform the data to match the model
  const transformedData = updatedData.map((listing) => ({
    ...listing,
    image: listing.image.url, // Extract just the URL from the image object
  }));

  await Listing.insertMany(transformedData);
  console.log("data was initialized");
};

initDb();
