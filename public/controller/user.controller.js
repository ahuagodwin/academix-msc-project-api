"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_model_1 = require("../models/user.model");
const Helpers_1 = require("../helpers/Helpers");
exports.getAllUsers = (0, express_async_handler_1.default)(async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch the current user with their roles
        const currentUser = await user_model_1.User.findById(userId)
            .populate("roles")
            .session(session);
        if (!currentUser) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if any of the user's roles has the "read_users" permission
        const hasPermission = currentUser.roles.some((role) => role.permissions.includes("read_users"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({
                error: "You're not permitted to view all users",
                status: false,
            });
            return;
        }
        // extracting query parameters
        const { page, limit, ...filters } = req.query;
        // applying pagination and filters
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        const query = (0, Helpers_1.buildQuery)(filters, ["firstName", "lastName"]);
        const totalRecords = await user_model_1.User.countDocuments(query);
        // Fetch all users
        const users = await user_model_1.User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select("-__v")
            .populate("roles", "name description")
            .populate("school", "name")
            .populate("wallet", "balance currency")
            .populate("storage_spaces", "size")
            .select("-password -emailVerificationCode -emailVerificationCodeValidation -refreshToken -passwordChangedAt -_v")
            .session(session);
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully.",
            count: users.length,
            data: users,
            pagination: (0, Helpers_1.paginateResults)(totalRecords, pageNumber, limitNumber),
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
});
