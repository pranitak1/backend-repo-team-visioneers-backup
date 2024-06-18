module.exports = (app) => {
  const {
    registerUser,
    loginUser,
    signOutUser,
    forgotPassword,
    verifyResetCode,
    resendOTP,
    resetPassword,
    changePassword,
    updateProfile,
  } = require("../controllers/auth.controller.js");

  const { ensureAuthenticated } = require("../utils/auth.js");

  const router = require("express").Router();

  // Register a new user
  router.post("/auth/register", registerUser);

  // Login a user
  router.post("/auth/login", loginUser);

  // Logout a user
  router.post("/auth/logout", signOutUser);

  // Route to handle forgot password (send reset code)
  router.post("/auth/forgotpassword", forgotPassword);

  // Route to handle verification of the reset code
  router.post("/auth/verification", verifyResetCode);

  // Route to handle resending the OTP
  router.post("/auth/resendotp", resendOTP);

  // Route to handle resetting the password
  router.post("/auth/resetpassword", resetPassword);

  // Route to handle change password
  router.post("/auth/changepassword", changePassword, ensureAuthenticated);

  // Route to handle updating the profile
  router.put("/auth/updateprofile", updateProfile, ensureAuthenticated);

  app.use("/api", router);
};
