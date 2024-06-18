const db = require("../models");
const UserModel = db.user;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Function to generate a random 4-digit code for forgot passowrd
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Configure nodemailer transporter for sending emails for forgot password
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_EMAIL_PASSWORD,
  },
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization endpoints
 */

module.exports = {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               imgKey:
   *                 type: string
   *               imgUrl:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: string
   *                     username:
   *                       type: string
   *                     email:
   *                       type: string
   *
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 err:
   *                   type: object
   */

  registerUser: async (req, res) => {
    // Validate request body
    const { username, email, password, imgKey, imgUrl, title } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User is already registered" });
    }

    //2.create userModel
    const userModel = new UserModel({
      username,
      email,
      password,
      imgKey,
      imgUrl,
      title,
    });
    //3.do password encryption
    userModel.password = await bcrypt.hash(password, 10);
    //4.save data to mongodb
    try {
      const response = await userModel.save();
      response.password = undefined;
      return res.status(201).json({ message: "sucessfull", user: response });
    } catch (err) {
      return res.status(500).json({ message: "error", err: err });
    }
  },

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login a user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 jwtToken:
   *                   type: string
   *       401:
   *         description: Invalid email or password
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: object
   */

  loginUser: async (req, res) => {
    const GUEST_EMAIL = process.env.GUEST_EMAIL;
    const GUEST_PASSWORD = process.env.GUEST_PASSWORD;

    let { email, password } = req.body;

    if (email === "guest" && password === "guest") {
      email = GUEST_EMAIL;
      password = GUEST_PASSWORD;
    }

    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isPassEqual = await bcrypt.compare(password, user.password);
      if (!isPassEqual) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const tokenObject = {
        _id: user._id,
        username: user.username,
        email: user.email,
        title: user.title,
        imgUrl: user.imgUrl,
      };
      const jwtToken = jwt.sign(tokenObject, process.env.JWT_SECRET, {
        expiresIn: "1h",
      }); //1 hour

      //set the cookie
      res.cookie("access_token", jwtToken, {
        httpOnly: true, // Make the cookie HTTP only, so it's not accessible via JavaScript
        secure: process.env.NODE_ENV === "production", // Set secure to true in production when using HTTPS
        maxAge: 3600000, // 1 hour
      });

      return res.status(200).json({ jwtToken: jwtToken, user: tokenObject });
    } catch (err) {
      return res.status(500).json({ message: "error", error: err });
    }
  },

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout a user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: User signed out successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */

  signOutUser: (req, res) => {
    try {
      // Clear the JWT cookie
      res.clearCookie("access_token");

      return res.status(200).send({ message: "You've been signed out!" });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send({ message: "An error occurred during signout." });
    }
  },

  /**
   * @swagger
   * /api/auth/forgotpassword:
   *   post:
   *     summary: Request a password reset code
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reset code sent to email
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 email:
   *                   type: string
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a 4-digit code
      const code = generateCode();
      user.resetCode = code;
      user.resetCodeExpiry = Date.now() + 600000; // Code valid for 10 minutes
      await user.save();

      // Send the code to the user's email
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${code}`,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Reset code sent to email", email: email });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error sending reset code", error: err.message });
    }
  },

  /**
   * @swagger
   * /api/auth/verification:
   *   post:
   *     summary: Verify a password reset code
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *             properties:
   *               email:
   *                 type: string
   *               code:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reset code verified
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid or expired reset code
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */

  verifyResetCode: async (req, res) => {
    const { email, code } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate the code
      if (user.resetCode !== code || Date.now() > user.resetCodeExpiry) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset code" });
      }

      res.status(200).json({ message: "Reset code verified" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error verifying reset code", error: err.message });
    }
  },

  /**
   * @swagger
   * /api/auth/resendotp:
   *   post:
   *     summary: Resend the password reset code
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: Reset code resent to email
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 email:
   *                   type: string
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */

  resendOTP: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate a new 4-digit code
      const code = generateCode();
      user.resetCode = code;
      user.resetCodeExpiry = Date.now() + 600000; // Code valid for 10 minutes
      await user.save();

      // Send the code to the user's email
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "Password Reset Code",
        text: `Your new password reset code is: ${code}`,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Reset code resent to email", email: email });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error resending reset code", error: err.message });
    }
  },

  /**
   * @swagger
   * /api/auth/resetpassword:
   *   post:
   *     summary: Reset the user's password
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *               - newPassword
   *             properties:
   *               email:
   *                 type: string
   *               code:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password reset successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid or expired reset code
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */

  resetPassword: async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate the code
      if (user.resetCode !== code || Date.now() > user.resetCodeExpiry) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset code" });
      }

      // Update the password
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetCode = undefined; // Clear the reset code and expiry
      user.resetCodeExpiry = undefined;
      await user.save();

      res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error resetting password", error: err.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, user } = req.body;

      // Find the user by userId
      const userId = await UserModel.findById(user);

      if (!userId) {
        return res.status(404).json({ message: "User not found" });
      }

      // Compare the current password with the password in the database
      const isMatch = await bcrypt.compare(currentPassword, userId.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid current password" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      userId.password = hashedPassword;

      await userId.save();
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  //For updating user profile
  updateProfile: async (req, res) => {
    const { title, userId } = req.body;

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.title = title;
      await user.save();

      const tokenObject = {
        _id: user._id,
        username: user.username,
        email: user.email,
        title: user.title,
        imgUrl: user.imgUrl,
      };

      res
        .status(200)
        .json({ message: "Profile updated successfully", user: tokenObject });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  },
};
