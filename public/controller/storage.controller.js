"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageAnalytics = exports.getAllStorageSpaces = exports.deleteStorageSpace = exports.updateStorageSpace = exports.createStorageSpace = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const types_1 = require("../types/types");
const user_model_1 = require("../models/user.model");
const storage_model_1 = __importDefault(require("../models/storage.model"));
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const Helpers_1 = require("../helpers/Helpers");
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
        // extracting query parameters
        const { page, limit, ...filters } = req.query;
        // applying pagination and filters
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        const query = (0, Helpers_1.buildQuery)(filters, ["name", "status"]);
        // Get total count for pagination
        const totalStorageSpaces = await storage_model_1.default.countDocuments(query);
        // Fetch storage spaces with pagination
        const storageSpaces = await storage_model_1.default.find(query)
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 })
            .select("-__v")
            .populate("createdBy", "firstName lastName email user_type")
            .populate("users", "_id");
        // Add user count for each storage space
        const storageSpacesWithUserCount = storageSpaces.map(storage => ({
            ...storage.toObject(),
            userCount: Array.isArray(storage.users) ? storage.users.length : 0
        }));
        res.status(200).json({
            success: true,
            message: "Storage spaces retrieved successfully",
            data: storageSpacesWithUserCount,
            pagination: (0, Helpers_1.paginateResults)(totalStorageSpaces, pageNumber, limitNumber),
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
const getStorageAnalytics = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        const hasPermission = user.roles.some(role => role.permissions.includes("view_storage_analytics"));
        if (!hasPermission) {
            res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
            return;
        }
        const totalStorage = await storage_model_1.default.countDocuments();
        const allStorages = await storage_model_1.default.find({}, "users");
        const userSet = new Set();
        allStorages.forEach(storage => {
            storage.users.forEach((user) => userSet.add(user.toString()));
        });
        const totalUsers = userSet.size;
        const totalActive = await storage_model_1.default.countDocuments({ status: "active" });
        const totalInactive = await storage_model_1.default.countDocuments({ status: "inactive" });
        // Monthly Chart Data (existing)
        const chartAggregation = await storage_model_1.default.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);
        const chartData = chartAggregation.map(item => ({
            date: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
            value: item.count
        }));
        // Daily trends (last 30 days)
        const dailyTrends = await storage_model_1.default.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);
        const formattedDailyTrends = dailyTrends.map(item => ({
            date: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}-${item._id.day.toString().padStart(2, "0")}`,
            value: item.count
        }));
        // Weekly trends (last 8 weeks)
        const weeklyTrends = await storage_model_1.default.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $isoWeekYear: "$createdAt" },
                        week: { $isoWeek: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } }
        ]);
        const formattedWeeklyTrends = weeklyTrends.map(item => ({
            week: `W${item._id.week} ${item._id.year}`,
            value: item.count
        }));
        // User activity trends
        const userActivityTrends = await storage_model_1.default.aggregate([
            {
                $group: {
                    _id: "$createdBy",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    fullName: {
                        $concat: ["$user.firstName", " ", "$user.lastName"]
                    },
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);
        res.status(200).json({
            success: true,
            message: "Storage analytics retrieved successfully",
            data: {
                totalStorage,
                totalUsers,
                totalActive,
                totalInactive,
                chartData,
                dailyTrends: formattedDailyTrends,
                weeklyTrends: formattedWeeklyTrends,
                userActivityTrends
            }
        });
    }
    catch (error) {
        console.error("Error fetching storage analytics:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.getStorageAnalytics = getStorageAnalytics;
