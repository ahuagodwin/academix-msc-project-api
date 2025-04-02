import { sendNotification } from "../email/notification";
import { Notification } from "../models/notification.model";
import { AuthenticatedRequest } from "../types/types";
import { Response } from "express";
import mongoose from "mongoose";


export const getUserNotifications = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?._id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      await session.abortTransaction();
      res.status(401).json({ success: false, message: "User not found or not authenticated" });
      return 
    }

    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};


export const deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
      res.status(400).json({ success: false, message: "Invalid notification ID" });
      return 
    }

    const notification = await Notification.findOneAndDelete({ _id: notificationId, user: userId });

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
      return 
    }

    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Mark notification as read or unread
 */
export const updateNotificationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?._id;
    const { notificationId } = req.params;
    const { isRead } = req.body;

    if (!mongoose.isValidObjectId(notificationId)) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: "Invalid notification ID" });
      return 
    }

    

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead },
      { new: true }
    ).session(session);

    if (!notification) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
      return 
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: `Notification marked as ${isRead ? "read" : "unread"}`, data: notification });
  } catch (error) {
    console.error("Error updating notification status:", error);
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

/**
 * Forward notification to another user
 */
export const forwardNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user?._id;
    const { notificationId } = req.params;
    const { recipientId } = req.body;

    if (!mongoose.isValidObjectId(notificationId) || !mongoose.isValidObjectId(recipientId)) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: "Invalid notification or recipient ID" });
      return 
    }

    const notification = await Notification.findOne({ _id: notificationId, user: senderId });

    if (!notification) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
      return 
    }

    const forwardedNotification = new Notification({
      user: recipientId,
      message: `Forwarded: ${notification.message}`,
      isRead: false,
    });

    await forwardedNotification.save({ session });

    await session.commitTransaction();
    session.endSession();

    await sendNotification({
      userId: recipientId,
      subject: "New Forwarded Notification",
      message: `You have received a forwarded notification: <br><b>${notification.message}</b>`,
      type: "general"
    });

    res.status(200).json({ success: true, message: "Notification forwarded successfully", data: forwardedNotification });
  } catch (error) {
    console.error("Error forwarding notification:", error);
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession();
  }
};
