const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: {
            type: String,
            // 1. FIX: Added a default image URL to prevent crashes and ensure display
            default: "https://res.cloudinary.com/dchoef4re/image/upload/v1700000000/default_listing.jpg", 
            set: (v) => v === "" ? "https://res.cloudinary.com/dchoef4re/image/upload/v1700000000/default_listing.jpg" : v,
        },
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref:"User",
    },
    category: {
        type: String,
        enum: ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Amazing Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"],
        default: "Trending",
    },
    
    // 2. CRITICAL FIX: The geometry schema must match the GeoJSON structure
    geometry: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'geometry.type' must be 'Point'
        required: true
      },
      coordinates: {
        type: [Number], // The array of coordinates [longitude, latitude]
        required: true
      }
    },
  },
);

// middleware to delete reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async function (listing) {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;