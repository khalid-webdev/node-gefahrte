require("dotenv").config({ quiet: true });
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

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

//getting the logged in user details

router.get("/",auth,async(req,res)=>{
  const profile  =req.user
  const user = await User.findById(req.user._id).select("-password");
  res.status(200).json(user);
})

//resetting password api

router.post("/request-reset-password", async (req, res) => {
const {email}=req.body
const user = await User.findOne({email:email})
if(!user)return res.status(401).json({message:"Email is not registered!Try to register new one!",success:false});

const resetToken = jwt.sign({_id:user._id},process.env.JWT_KEY,{expiresIn:"1h"});

res.status(201).json({message:"password reset link send to email",resetToken:resetToken})
});


router.post("/reset-password", async (req, res) => {
  const {resetToken,newPassword} =req.body;
  //step:1 verify the token
  const verifiedUser =jwt.verify(resetToken,process.env.JWT_KEY);
  let user = await User.findById(verifiedUser._id);
  if(!user)return res.status(400).json({message:"Invalid or expires token!"})

    //step:2 if token is verified then save the new password
  const hashedPass = await bcrypt.hash(newPassword,10);

  user.password=hashedPass
  await user.save();

  res.json({message:"Password reset successfully"})
});

const generateToken = (object) => {
  return jwt.sign(object, process.env.JWT_KEY);
};

module.exports = router;
