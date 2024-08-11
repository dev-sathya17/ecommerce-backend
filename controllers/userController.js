// Importing bcrypt library for encrypting passwords
const bcrypt = require("bcrypt");

// Importing the jwt library
const jwt = require("jsonwebtoken");

// Importing the User model
const User = require("../models/user");

// Importing the EMAIL_ID from the configuration file
const { SECRET_KEY } = require("../utils/config");

// Importing the user helper function to generate an auth string
const { generateRandomString } = require("../helpers/userHelper");

const sendEmail = require("../helpers/emailHelper");

const userController = {
  // API for registering users
  register: async (req, res) => {
    try {
      // Destructuring the request body
      const { name, email, password, mobile, role } = req.body;

      // Checking if user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.json({ message: "User with this email already exists" });
      }

      // Checking if mobile number already exists
      const existingMobile = await User.findOne({ mobile });

      if (existingMobile) {
        return res.json({ message: "Mobile number must be unique" });
      }

      // Encrypting the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creating a new user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        mobile,
        role,
      });

      // Saving the user to the database
      await user.save();

      // Sending a success response
      res.status(201).json({
        message: "Your account has been created successfully.",
        user,
      });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API for user login
  login: async (req, res) => {
    try {
      // getting the user email and password from the request body
      const { email, password } = req.body;

      // checking if the user exists in the database
      const user = await User.findOne({ email });

      // if the user does not exist, return an error response
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // if the user exists check the password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // if the password is invalid, return an error response
      if (!isPasswordValid) {
        return res.status(400).send({ message: "Invalid password" });
      }

      // generating a JWT token
      const token = jwt.sign({ id: user._id }, SECRET_KEY);

      // setting the token as a cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now() + 24 * 3600000), // 24 hours from login
        path: "/",
      });

      // Setting user role as cookie
      res.cookie("role", user.role, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now() + 24 * 3600000), // 24 hours from login
        path: "/",
      });

      // sending a success response
      res.status(200).json({
        message: "Login successful",
        user,
      });
    } catch (error) {
      // sending an error response
      res.status(500).send({ message: error.message });
    }
  },

  // API for user logout
  logout: async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(400).send({ message: "User not authenticated" });
      }

      // clearing the cookie
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      res.clearCookie("role", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      // sending a success response
      res.status(200).send({ message: "Logged out successfully" });
    } catch (error) {
      // Sending an error response
      res.status(500).send({ message: error.message });
    }
  },

  // API for sending email for the user when user wants to reset password
  forgotPassword: async (req, res) => {
    try {
      // Extracting values from request body
      const { email } = req.body;

      // Checking if this email is of a valid user
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ message: "User with this email does not exist" });
      }

      // Generating auth string
      const authString = generateRandomString();

      // Update user
      user.authString = authString;
      await user.save();

      const subject = "Reset Password";
      const message = `Click here to reset your password: http://localhost:3000/api/v1/users/verify/${authString}`;

      // Sending an email
      sendEmail(email, subject, message);

      // Sending a success response
      res.status(200).json({
        message: "Password reset link has been sent to your email address",
      });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API for verifying the user auth string
  authVerify: async (req, res) => {
    try {
      // Extracting values from request params
      const { authString } = req.params;

      // Checking if this auth string is of a valid user
      const user = await User.findOne({ authString });
      if (!user) {
        return res.status(404).json({ message: "Auth string does not match!" });
      }

      // Sending a success response
      res.status(200).json({
        message: "Auth String verified successfully",
        email: user.email,
      });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API for resetting password
  resetPassword: async (req, res) => {
    try {
      // Extracting values from request body
      const { email, password } = req.body;

      // Checking if this email is of a valid user
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json({ message: "User with this email does not exist" });
      }

      // Encrypting the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user
      user.password = hashedPassword;
      user.authString = "";
      await user.save();

      // Sending a success response
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API to get user profile information
  getProfile: async (req, res) => {
    try {
      // Getting user id from request parameters
      const id = req.userId;

      // Fetching the user from the database
      const user = await User.findById(id, "-password -authString -__v");

      // If user not found, return error response
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user found, return the user data
      res.json(user);
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API to update user profile information
  updateProfile: async (req, res) => {
    try {
      // Getting user id from request parameters
      const { id } = req.params;
      const { name, email, mobile } = req.body;

      const user = await User.findById(id);

      // If user not found, return error response
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Updating user profile information
      user.name = name || user.name;
      user.email = email || user.email;
      user.mobile = mobile || user.mobile;

      // Saving info to the database
      const updatedUser = await user.save();

      // If user found, return the updated user data
      res.json({ message: "User profile updated successfully", updatedUser });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API to delete user
  deleteUser: async (req, res) => {
    try {
      // Getting user id from request parameters
      const { id } = req.params;

      // Finding and deleting the user from the database using the id in the request parameters.
      const user = await User.findByIdAndDelete(id);

      // If user not found, return error response
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Removing the user cookie
      res.clearCookie("token");

      // returning success response, if user is deleted
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // API to check authentication
  checkAuthentication: async (req, res) => {
    try {
      const token = req.cookies.token;
      const role = req.cookies.role;

      // If token does not exist
      if (!token) {
        return res.status(401).json({ message: "Access Denied" });
      }

      // Verifying the token using JWT
      try {
        const verified = jwt.verify(token, SECRET_KEY);
        res.status(200).json({ message: "Authentication successful", role });
      } catch (error) {
        // Sending an error response
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },

  // Admin Functionalities

  // API to fetch all users from the database
  getAllUsers: async (req, res) => {
    try {
      // Fetching all users from the database
      const users = await User.find();

      const data = users.filter((user) => user.role !== "admin");

      // Returning the fetched users
      res.json({ allUsers: data });
    } catch (error) {
      // Sending an error response
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = userController;
