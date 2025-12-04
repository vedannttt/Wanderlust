// REQUIRED MODULES 
if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
// FIX: Assign the required module to a temporary variable
const MongoStoreModule = require('connect-mongo'); 
// FIX: Get the main store function/constructor. In modern use, it's the default export.
const MongoStore = MongoStoreModule.default || MongoStoreModule;

const flash= require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const {isLoggedIn} = require("./middleware.js");

// ROUTERS
const listingsRouter = require("./routes/listings.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// DATABASE CONNECTION
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    // FIX: Increased the connection timeout to 30 seconds (30000ms) to prevent buffering timeout errors
    await mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 30000, 
    });
}

// VIEW ENGINE SETUP
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// FIX: This should now correctly access the create function
const store = MongoStore.create({ 
    mongoUrl: dbUrl,
    crypto: {
        secret: "process.env.SECRET" 
    },
    touchAfter: 24*3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: "process.env.SECRET",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, 
    }
};

// ROOT ROUTE
//app.get("/", (req, res) => {
//    res.send("Hi, I am root");
//});


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res, next ) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
next();
});

//app.get("/demouser", async (req, res) =>{
//let fakeUser = new UserActivation({
//    email: "student@gmail.com",
//    username:"delta-student",
//});

//let registeredUser = await User.register(fakeUser, "helloworld");
//res.send(registeredUser);
//});

// MOUNT ROUTERS
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);



// 404 ERROR HANDLER
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// SERVER LISTEN
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});