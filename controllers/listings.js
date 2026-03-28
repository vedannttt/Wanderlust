const Listing = require("../models/listing");
// 1. Mapbox Token name corrected: use MAPBOX_TOKEN as recommended
const mapToken = process.env.MAPBOX_TOKEN;
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: mapToken});

// Index route (with optional search)
module.exports.index = async (req, res) => {
    const { q } = req.query;
    let allListings;
    if (q && q.trim() !== "") {
        const regex = new RegExp(q.trim(), "i");
        allListings = await Listing.find({
            $or: [
                { title: regex },
                { location: regex },
                { country: regex },
                { category: regex },
            ]
        });
    } else {
        allListings = await Listing.find({});
    }
    res.render("listings/index.ejs", { allListings, searchQuery: q || "" });
};

// Render new form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// Create listing - CORRECTED
module.exports.createListing = async (req, res) => {
    // 2. CREATE THE LISTING INSTANCE FIRST
    const listing = new Listing(req.body.listing);

    // CHECK IF USER UPLOADED FILE
    if (req.file) {
        // Ensure image object is correctly structured
        listing.image = {
            url: req.file.path,      // Cloudinary URL
            filename: req.file.filename
        };
    } else {
        // If no file, provide a default image to prevent errors
        listing.image = {
            url: "https://res.cloudinary.com/dchoef4re/image/upload/v1700000000/default_listing.jpg", 
            filename: "default-image"
        };
    }

    // 3. GEOCODING: Use the listing's location (non-fatal if it fails)
    try {
        let response = await geocodingClient.forwardGeocode({
            query: `${listing.location}, ${listing.country}`,
            limit: 1,
        }).send();

        if (response.body.features && response.body.features.length > 0) {
            listing.geometry = response.body.features[0].geometry;
        }
    } catch (geocodeErr) {
        console.warn("Geocoding failed (map will be unavailable):", geocodeErr.message);
    }

    listing.owner = req.user._id;

    let savedListing = await listing.save();
    console.log(savedListing);

    req.flash("success", "New listing created!");
    res.redirect(`/listings/${listing._id}`);
};

// Show listing
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Pass the Mapbox token for client-side map script
    res.render("listings/show.ejs", { listing, mapToken }); // Pass mapToken here
};

// Render edit form
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl }); // Pass originalImageUrl
};

// Update listing
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, { new: true });

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }

    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${listing._id}`);
};


// Delete listing
module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
};