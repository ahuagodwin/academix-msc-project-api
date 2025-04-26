"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTransactions = exports.getAllTransactions = void 0;
const Helpers_1 = require("../helpers/Helpers");
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const transactions_model_1 = require("../models/transactions.model");
const user_model_1 = require("../models/user.model");
const getAllTransactions = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Find user and check roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if user is either a system owner or has view_transaction permission
        const isOwner = (0, isSystemOwner_1.isSystemOwner)(userId);
        const hasPermission = user.roles.some((role) => role.permissions.includes("view_transaction"));
        if (!isOwner && !hasPermission) {
            res.status(403).json({ error: "You're not permitted to view all transactions", status: false });
            return;
        }
        // Extract query parameters
        const { page, limit, status, startDate, endDate, paymentMethod, channel, ...filters } = req.query;
        // Build query filters
        const query = (0, Helpers_1.buildQuery)(filters, ["transactionReference", "description"]);
        // Add status filter if provided
        if (status && ["pending", "completed", "failed"].includes(status)) {
            query.status = status;
        }
        // Add payment method filter if provided
        if (paymentMethod) {
            query.paymentMethod = paymentMethod;
        }
        // Add channel filter if provided
        if (channel) {
            query.channel = channel;
        }
        // Add date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        // Calculate transaction analytics
        const [totalTransactionsCount, successfulTransactionsCount, failedTransactionsCount, pendingTransactionsCount, amountStats] = await Promise.all([
            transactions_model_1.Transaction.countDocuments({}),
            transactions_model_1.Transaction.countDocuments({ status: "completed" }),
            transactions_model_1.Transaction.countDocuments({ status: "failed" }),
            transactions_model_1.Transaction.countDocuments({ status: "pending" }),
            transactions_model_1.Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                        averageAmount: { $avg: "$amount" }
                    }
                }
            ])
        ]);
        // Extract amount statistics
        const totalAmount = amountStats.length > 0 ? amountStats[0].totalAmount : 0;
        const averageAmount = amountStats.length > 0 ? amountStats[0].averageAmount : 0;
        // Apply pagination
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        // Get total count of matching records
        const totalRecords = await transactions_model_1.Transaction.countDocuments(query);
        // Fetch transactions
        const transactions = await transactions_model_1.Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select("-__v")
            .populate("userId", "firstName lastName email");
        // Prepare analytics data
        const analytics = {
            totalTransactions: totalTransactionsCount,
            successfulTransactions: successfulTransactionsCount,
            failedTransactions: failedTransactionsCount,
            pendingTransactions: pendingTransactionsCount,
            totalAmount: totalAmount,
            averageAmount: averageAmount
        };
        res.status(200).json({
            success: true,
            message: "Transactions retrieved successfully",
            data: transactions,
            analytics: analytics,
            pagination: (0, Helpers_1.paginateResults)(totalRecords, pageNumber, limitNumber),
        });
    }
    catch (error) {
        console.error("Fetch All Transactions Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getAllTransactions = getAllTransactions;
const getUserTransactions = async (req, res) => {
    try {
        const authenticatedUserId = req.user?._id;
        const requestedUserId = req.params.userId;
        if (!authenticatedUserId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Find user and check roles
        const user = await user_model_1.User.findById(authenticatedUserId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if the authenticated user is requesting their own transactions or has proper permissions
        const isOwnTransactions = authenticatedUserId.toString() === requestedUserId;
        const isOwner = (0, isSystemOwner_1.isSystemOwner)(authenticatedUserId);
        const hasPermission = user.roles.some((role) => role.permissions.includes("view_transaction"));
        if (!isOwnTransactions && !isOwner && !hasPermission) {
            res.status(403).json({ error: "You're not permitted to view these transactions", status: false });
            return;
        }
        // Verify the requested user exists
        const requestedUser = await user_model_1.User.findById(requestedUserId);
        if (!requestedUser) {
            res.status(404).json({ success: false, message: "Requested user not found" });
            return;
        }
        // Extract query parameters
        const { page, limit, status, startDate, endDate, ...filters } = req.query;
        // Build query filters
        const query = (0, Helpers_1.buildQuery)(filters, ["transactionReference"]);
        // Set userId filter to the requested user
        query.userId = requestedUserId;
        // Add status filter if provided
        if (status && ["pending", "completed", "failed"].includes(status)) {
            query.status = status;
        }
        // Add date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        // Calculate transaction analytics
        const [totalTransactionsCount, successfulTransactionsCount, failedTransactionsCount, pendingTransactionsCount, amountStats] = await Promise.all([
            transactions_model_1.Transaction.countDocuments({}),
            transactions_model_1.Transaction.countDocuments({ status: "completed" }),
            transactions_model_1.Transaction.countDocuments({ status: "failed" }),
            transactions_model_1.Transaction.countDocuments({ status: "pending" }),
            transactions_model_1.Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                        averageAmount: { $avg: "$amount" }
                    }
                }
            ])
        ]);
        // Extract amount statistics
        const totalAmount = amountStats.length > 0 ? amountStats[0].totalAmount : 0;
        const averageAmount = amountStats.length > 0 ? amountStats[0].averageAmount : 0;
        // Apply pagination
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        // Get total count of matching records
        const totalRecords = await transactions_model_1.Transaction.countDocuments(query);
        // Fetch transactions
        const transactions = await transactions_model_1.Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select("-__v")
            .populate("userId", "firstName lastName email");
        // Prepare analytics data
        const analytics = {
            totalTransactions: totalTransactionsCount,
            successfulTransactions: successfulTransactionsCount,
            failedTransactions: failedTransactionsCount,
            pendingTransactions: pendingTransactionsCount,
            totalAmount: totalAmount,
            averageAmount: averageAmount
        };
        res.status(200).json({
            success: true,
            message: "User transactions retrieved successfully",
            data: transactions,
            analytics: analytics,
            pagination: (0, Helpers_1.paginateResults)(totalRecords, pageNumber, limitNumber),
        });
    }
    catch (error) {
        console.error("Fetch User Transactions Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getUserTransactions = getUserTransactions;
