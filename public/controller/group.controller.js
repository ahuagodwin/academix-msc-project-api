"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAccessToGroup = exports.getAllGroups = exports.getUserGroups = exports.deleteGroup = exports.addUsersToGroup = exports.updateGroup = exports.createGroup = void 0;
const user_model_1 = require("../models/user.model");
const group_model_1 = __importDefault(require("../models/group.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const notification_1 = require("../email/notification");
const groupRequest_model_1 = __importDefault(require("../models/groupRequest.model"));
// Create a Group**
const createGroup = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { name, members } = req.body;
        const ownerId = req.user?._id;
        if (!name || !Array.isArray(members) || members.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Group name and at least one member are required" });
            return;
        }
        // Ensure members exist
        const validMembers = await user_model_1.User.find({ _id: { $in: members } });
        if (validMembers.length !== members.length) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Some members do not exist" });
            return;
        }
        // Fetch owner details
        const owner = await user_model_1.User.findById(ownerId).select("firstName");
        if (!owner) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Owner not found" });
            return;
        }
        // Ensure owner is included only once
        const uniqueMembers = [...new Set([ownerId, ...members])];
        // Create new group
        const newGroup = new group_model_1.default({
            name,
            owner: ownerId,
            members: uniqueMembers,
            files: [],
        });
        await newGroup.save({ session });
        await session.commitTransaction();
        session.endSession();
        for (const userId of uniqueMembers) {
            await (0, notification_1.sendNotification)({
                userId,
                subject: `Group Creation`,
                message: `'${name}' Group have been created  by ${owner.firstName}`,
                type: "group"
            });
        }
        res.status(201).json({ success: true, message: "Group created successfully", data: newGroup });
    }
    catch (error) {
        console.error("Error creating group:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.createGroup = createGroup;
const updateGroup = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { groupId } = req.params;
        const { name, addMembers, removeMembers } = req.body;
        const ownerId = req.user?._id;
        // Find the group
        const group = await group_model_1.default.findById(groupId);
        if (!group) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }
        // Ensure only the owner can update the group
        if (String(group.owner) !== String(ownerId)) {
            await session.abortTransaction();
            res.status(403).json({ success: false, message: "You do not have permission to update this group." });
            return;
        }
        // Update group name if provided
        if (name)
            group.name = name;
        // Add new members
        if (addMembers && Array.isArray(addMembers) && addMembers.length > 0) {
            const validUsers = await user_model_1.User.find({ _id: { $in: addMembers } }).session(session);
            if (validUsers.length !== addMembers.length) {
                await session.abortTransaction();
                res.status(400).json({ success: false, message: "Some members do not exist" });
                return;
            }
            group.members = [...new Set([...group.members, ...addMembers])];
        }
        // Remove members
        if (removeMembers && Array.isArray(removeMembers) && removeMembers.length > 0) {
            group.members = group.members.filter((member) => !removeMembers.includes(String(member)));
        }
        await group.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: "Group updated successfully", data: group });
    }
    catch (error) {
        console.error("Error updating group:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.updateGroup = updateGroup;
// Add a User to a Group**
const addUsersToGroup = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;
        const ownerId = req.user?._id;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "userIds must be a non-empty array" });
            return;
        }
        const group = await group_model_1.default.findById(groupId).session(session);
        if (!group) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }
        // Fetch owner details
        const owner = await user_model_1.User.findById(ownerId).select("firstName");
        if (!owner) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Owner not found" });
            return;
        }
        // Ensure only the group owner can add members
        if (String(group.owner) !== String(ownerId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "You do not have permission to add members to this group." });
            return;
        }
        // Remove duplicates and already existing members
        const uniqueUserIds = userIds.filter((id) => !group.members.includes(id));
        if (uniqueUserIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "All provided users are already in the group." });
            return;
        }
        // Add users to the group
        group.members.push(...uniqueUserIds);
        await group.save({ session });
        await session.commitTransaction();
        session.endSession();
        for (const userId of uniqueUserIds) {
            await (0, notification_1.sendNotification)({
                userId,
                subject: `Welcome to ${group.name} Group`,
                message: `You have been added to the group '${group.name}' by ${owner.firstName}`,
                type: "group"
            });
        }
        res.status(200).json({ success: true, message: "Users added to group successfully", data: group });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error adding users to group:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.addUsersToGroup = addUsersToGroup;
const deleteGroup = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { groupId } = req.params;
        const ownerId = req.user?._id;
        const group = await group_model_1.default.findById(groupId).session(session);
        if (!group) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }
        // Ensure only the group owner can delete the group
        if (String(group.owner) !== String(ownerId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "You do not have permission to delete this group." });
            return;
        }
        // Ensure no users remain in the group except the owner
        if (group.members.length > 1) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: "Cannot delete group. Remove all members before deleting."
            });
            return;
        }
        // Delete the group
        await group_model_1.default.findByIdAndDelete(groupId).session(session);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: "Group deleted successfully" });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting group:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.deleteGroup = deleteGroup;
// Get User's Groups**
const getUserGroups = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Fetch groups where the user is a member or owner
        const groups = await group_model_1.default.find({ members: userId })
            .populate("owner", "name email") // Fetch owner details
            .populate("members", "name email") // Fetch member details
            .lean();
        res.status(200).json({
            success: true,
            message: "User groups retrieved successfully",
            data: groups,
        });
    }
    catch (error) {
        console.error("Error fetching user groups:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getUserGroups = getUserGroups;
const getAllGroups = async (req, res) => {
    const session = await mongoose_1.default.startSession(); // Start session
    session.startTransaction();
    try {
        const userId = req.user?._id;
        // Ensure user is authenticated
        if (!userId) {
            await session.abortTransaction();
            res.status(401).json({ success: false, message: "Unauthorized: No user found" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if the user is a system owner
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            await session.abortTransaction();
            res.status(403).json({ error: "Only system owners can read all groups", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_groups"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to read all groups", status: false });
            return;
        }
        // Fetch all groups and populate owner & members details
        const groups = await group_model_1.default.find()
            .populate("owner", "name email") // Fetch owner details
            .populate("members", "name email") // Fetch member details
            .lean();
        await session.commitTransaction();
        res.status(200).json({
            success: true,
            message: "All groups retrieved successfully",
            data: groups,
        });
    }
    catch (error) {
        console.error("Error fetching all groups:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession(); // Ensure session ends
    }
};
exports.getAllGroups = getAllGroups;
const requestAccessToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?._id;
        // Ensure user is authenticated
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: No user found" });
            return;
        }
        // Find the group
        const group = await group_model_1.default.findById(groupId).populate("owner", "firstName email");
        if (!group) {
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }
        // Check if user is already a member
        if (group.members.includes(userId)) {
            res.status(400).json({ success: false, message: "You are already a member of this group" });
            return;
        }
        // Check if the request already exists
        const existingRequest = await groupRequest_model_1.default.findOne({ group: groupId, user: userId });
        if (existingRequest) {
            res.status(400).json({ success: false, message: "You have already requested access to this group" });
            return;
        }
        // Create a new request
        const newRequest = new groupRequest_model_1.default({ user: userId, group: groupId, status: "pending" });
        await newRequest.save();
        // Notify the group owner about the access request
        await (0, notification_1.sendNotification)({
            userId: group.owner._id,
            subject: "New Group Access Request",
            message: `User has requested access to join the group '${group.name}'.`,
            type: "access"
        });
        res.status(200).json({ success: true, message: "Access request sent successfully" });
    }
    catch (error) {
        console.error("Error requesting access to group:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.requestAccessToGroup = requestAccessToGroup;
