// Importing the express library
const express = require("express");

// Importing the user Controller
const userController = require("../controllers/userController");

// Importing middleware
const auth = require("../middlewares/auth");

// Creating a router
const userRouter = express.Router();

// Route to verify authentication

userRouter.get("/checkAuth", userController.checkAuthentication);

// Route to register a user
userRouter.post("/", userController.register);

// Route for user login
userRouter.post("/login", userController.login);

// Route for user logout
userRouter.get(
  "/logout",
  auth.authenticate,
  auth.cacheControl,
  userController.logout
);

// Route for forgot password
userRouter.post("/forgot", userController.forgotPassword);

// Route for verifying auth string
userRouter.get("/verify/:authString", userController.authVerify);

// Route for resetting the password
userRouter.post("/reset", userController.resetPassword);

// Route for getting user profile
userRouter.get("/", auth.authenticate, userController.getProfile);

// Route for updating user profile
userRouter.put("/:id", auth.authenticate, userController.updateProfile);

// Route for deleting user
userRouter.delete("/:id", auth.authenticate, userController.deleteUser);

// Admin Routes

// Fetching all users
userRouter.get(
  "/admin",
  auth.authenticate,
  auth.isAdmin,
  userController.getAllUsers
);

// Exporting the router
module.exports = userRouter;
