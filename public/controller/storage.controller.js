"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStorageSpaces = exports.deleteStorageSpace = exports.updateStorageSpace = exports.createStorageSpace = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const types_1 = require("../types/types");
const user_model_1 = require("../models/user.model");
const storage_model_1 = __importDefault(require("../models/storage.model"));
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
// Ensure role interface is available
const createStorageSpace = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Extract storage data from request body
        const { name, size, price } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Check if the user is a system owner
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            await session.abortTransaction();
            res.status(403).json({ error: "Only system owners can create storage space", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_storage"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to create storage" });
            return;
        }
        if (!name || !size || !price) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "Name, size and price are required." });
            return;
        }
        // uncomment if only i want to place a restriction of a storage space size from backend
        // if (!validStorageSizes.includes(size)) {
        //   await session.abortTransaction();
        //   session.endSession();
        //   res.status(400).json({ success: false, message: "Invalid storage size." });
        //   return 
        // }
        // Create storage space
        const newStorage = await storage_model_1.default.create([{ name, size, price, createdBy: userId, status: types_1.StorageStatus.active }], { session });
        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Storage space created successfully", data: newStorage[0] });
        return;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error creating storage:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
    finally {
        session.endSession();
    }
};
exports.createStorageSpace = createStorageSpace;
// to update storage space
const updateStorageSpace = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { storageId } = req.params;
        const { name, size, price, status } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Check if the user is a system owner
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            await session.abortTransaction();
            res.status(403).json({ error: "Only system owners can update storage space", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("update_storage"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to update storage" });
            return;
        }
        // Ensure storage ID is valid
        if (!mongoose_1.default.Types.ObjectId.isValid(storageId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "Invalid storage ID" });
            return;
        }
        // Find the storage space
        const storage = await storage_model_1.default.findById(storageId).session(session);
        if (!storage) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Storage space not found" });
            return;
        }
        if (status && !Object.values(types_1.StorageStatus).includes(status)) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "Invalid storage status" });
            return;
        }
        // Update storage fields
        if (name)
            storage.name = name;
        if (size)
            storage.size = size;
        if (price)
            storage.price = price;
        if (status)
            storage.status = status;
        await storage.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: "Storage updated successfully", data: storage });
        return;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error updating storage:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
    finally {
        session.endSession();
    }
};
exports.updateStorageSpace = updateStorageSpace;
// to delete storage space
const deleteStorageSpace = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { storageId } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Check if the user is a system owner
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            await session.abortTransaction();
            res.status(403).json({ error: "Only system owners can delete storage space", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_storage"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to delete storage" });
            return;
        }
        // Ensure storage ID is valid
        if (!mongoose_1.default.Types.ObjectId.isValid(storageId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "Invalid storage ID" });
            return;
        }
        // Find and delete the storage space
        const storage = await storage_model_1.default.findByIdAndDelete(storageId).session(session);
        if (!storage) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Storage space not found" });
            return;
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: "Storage deleted successfully" });
        return;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error deleting storage:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
    finally {
        session.endSession();
    }
};
exports.deleteStorageSpace = deleteStorageSpace;
const getAllStorageSpaces = async (req, res) => {
    try {
        // Get userId from request (ensure middleware sets req.user)
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_storage"));
        if (!hasPermission) {
            res.status(403).json({ success: false, message: "Unauthorized to view storage spaces" });
            return;
        }
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Fetch storage spaces with pagination
        const storageSpaces = await storage_model_1.default.find().skip(skip).limit(limit).sort({ createdAt: -1 });
        // Get total count for pagination
        const totalStorageSpaces = await storage_model_1.default.countDocuments();
        res.status(200).json({
            success: true,
            message: "Storage spaces retrieved successfully",
            data: storageSpaces,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalStorageSpaces / limit),
                totalItems: totalStorageSpaces,
            },
        });
        return;
    }
    catch (error) {
        console.error("Error fetching storage spaces:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
};
exports.getAllStorageSpaces = getAllStorageSpaces;
