const db = require("../models");
const Notification = db.notification;

module.exports = {
  fetchUnreadNotifications: async (req, res) => {
    try {
      const userId = req.params.userId;
      const notifications = await Notification.find({ userId, isRead: false });
      res.status(200).json(notifications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  markNotificationAsRead: async (req, res) => {
    try {
      const notificationId = req.params.notificationId;
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      res.status(200).json({
        message: "Notification marked as read",
        notificationId: notificationId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
