module.exports = (app) => {
  const {
    fetchUnreadNotifications,
    markNotificationAsRead,
  } = require("../controllers/notification.controller");

  const router = require("express").Router();

  // Route to fetch unread notifications
  router.get("/notifications/:userId", fetchUnreadNotifications);

  // Route to mark notification as read
  router.patch("/notifications/:notificationId/read", markNotificationAsRead);

  app.use("/api", router);
};
