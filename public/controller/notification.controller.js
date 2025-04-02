"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forwardNotification = exports.updateNotificationStatus = exports.deleteNotification = exports.getUserNotifications = void 0;
const notification_1 = require("../email/notification");
const notification_model_1 = require("../models/notification.model");
const mongoose_1 = __importDefault(require("mongoose"));
const getUserNotifications = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id;
        if (!userId || !mongoose_1.default.isValidObjectId(userId)) {
            await session.abortTransaction();
            res.status(401).json({ success: false, message: "User not found or not authenticated" });
            return;
        }
        const notifications = await notification_model_1.Notification.find({ user: userId }).sort({ createdAt: -1 });
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, data: notifications });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.getUserNotifications = getUserNotifications;
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { notificationId } = req.params;
        if (!mongoose_1.default.isValidObjectId(notificationId)) {
            res.status(400).json({ success: false, message: "Invalid notification ID" });
            return;
        }
        const notification = await notification_model_1.Notification.findOneAndDelete({ _id: notificationId, user: userId });
        if (!notification) {
            res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
            return;
        }
        res.status(200).json({ success: true, message: "Notification deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Mark notification as read or unread
 */
const updateNotificationStatus = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id;
        const { notificationId } = req.params;
        const { isRead } = req.body;
        if (!mongoose_1.default.isValidObjectId(notificationId)) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Invalid notification ID" });
            return;
        }
        const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { isRead }, { new: true }).session(session);
        if (!notification) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
            return;
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: `Notification marked as ${isRead ? "read" : "unread"}`, data: notification });
    }
    catch (error) {
        console.error("Error updating notification status:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.updateNotificationStatus = updateNotificationStatus;
/**
 * Forward notification to another user
 */
const forwardNotification = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const senderId = req.user?._id;
        const { notificationId } = req.params;
        const { recipientId } = req.body;
        if (!mongoose_1.default.isValidObjectId(notificationId) || !mongoose_1.default.isValidObjectId(recipientId)) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Invalid notification or recipient ID" });
            return;
        }
        const notification = await notification_model_1.Notification.findOne({ _id: notificationId, user: senderId });
        if (!notification) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
            return;
        }
        const forwardedNotification = new notification_model_1.Notification({
            user: recipientId,
            message: `Forwarded: ${notification.message}`,
            isRead: false,
        });
        await forwardedNotification.save({ session });
        await session.commitTransaction();
        session.endSession();
        await (0, notification_1.sendNotification)({
            userId: recipientId,
            subject: "New Forwarded Notification",
            message: `You have received a forwarded notification: <br><b>${notification.message}</b>`,
            type: "general"
        });
        res.status(200).json({ success: true, message: "Notification forwarded successfully", data: forwardedNotification });
    }
    catch (error) {
        console.error("Error forwarding notification:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.forwardNotification = forwardNotification;
