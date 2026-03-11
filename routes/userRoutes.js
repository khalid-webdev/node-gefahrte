require("dotenv").config({ quiet: true });
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

//user registration
router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Missing required form fields", success: false });
  }
  const user = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });
  if (user) {
    return res.status(400).json({
      message:
        user.username === username
          ? "username is already taken!"
          : "Email is already registered!",
      success: false,
    });
  }
  const hashedPass = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashedPass,
  });
  await newUser.save();
  const token = generateToken({ _id: newUser._id, username: newUser.username });
  res.status(201).json(token);
});
//user login

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Input field cannot be empty" });
  }
  const user = await User.findOne({ username: username });
  console.log(user);
  if (!user)
    return res
      .status(401)
      .json({ message: "Invalid credentials", success: false });

  //compare password
  const comparedPass = await bcrypt.compare(password, user.password);
  console.log(comparedPass);
  if (!comparedPass)
    return res
      .status(401)
      .json({ message: "Invalid credentials", success: false });

  const token = generateToken({ _id: user._id, username: user.username });
  res.json(token);
});

//resetting password api

router.post("/request-reset-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return res
      .status(400)
      .json({ message: "This email is not registered!", success: false });
  }
  const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_KEY, {
    expiresIn: "1h",
  });
  res.json({
    message: "Password reset link sent to the email",
    resetToken: resetToken,
  });
});
router.post("/reset-password", async (req, res) => {});

const generateToken = (object) => {
  return jwt.sign(object, process.env.JWT_KEY);
};

module.exports = router;
