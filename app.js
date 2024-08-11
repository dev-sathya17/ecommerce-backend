// Importing the express library
const express = require("express");

// Importing the user router
const userRouter = require("./routes/userRoutes");

// Importing the morgan library to log requests
const morgan = require("morgan");

// Importing the cors library
const cors = require("cors");

// Importing the cookie parser library
const cookieParser = require("cookie-parser");

// Custom error handler middleware
const errorHandler = require("./utils/Error");

const app = express();

// Adding the cors middleware to allow cross-origin requests
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// parse the cookies of the request
app.use(cookieParser());

// Adding middleware to parse the request body
app.use(express.json());

// to log requests
app.use(morgan("dev"));

// Creating routes
app.use("/api/v1/users", userRouter);

// Handle 404 error
app.use(errorHandler);

module.exports = app;
