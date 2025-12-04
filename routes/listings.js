// routes/listings.js
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

// 1. FIX: Import only the required Multer functions from the controller setup
const listingController = require("../controllers/listings"); 

const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });


// INDEX + CREATE
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('listing[image]'), // Middleware for image upload
    validateListing,
    wrapAsync(listingController.createListing)
  );

// NEW - Form to create new listing
router.get("/new", isLoggedIn, listingController.renderNewForm);

// SHOW + UPDATE + DELETE
router.route("/:id")
  // 2. FIX: Corrected Controller function name from ShowListing to showListing
  .get(wrapAsync(listingController.showListing)) 
  .put(
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'), // Middleware for image upload
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    // 3. FIX: Controller method for delete is deleteListing, not destroyListing
    wrapAsync(listingController.deleteListing) 
  );

// EDIT - Show form to edit listing
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;