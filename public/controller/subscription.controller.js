"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoragePurchaseById = exports.getUserStoragePurchases = exports.deleteStoragePurchase = exports.checkAvailableStorage = exports.purchaseStorage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const storage_model_1 = __importDefault(require("../models/storage.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model")); // Import Wallet model
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const user_model_1 = require("../models/user.model");
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const Helpers_1 = require("../helpers/Helpers");
const inflow_model_1 = require("../models/inflow.model");
const financialSummary_model_1 = require("../models/financialSummary.model");
const purchaseStorage = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { storageId, totalStorage } = req.body;
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
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_subscription"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to create storage" });
            return;
        }
        if (!storageId || !totalStorage || totalStorage <= 0) {
            res.status(400).json({ success: false, message: "Invalid storage selection or size." });
            return;
        }
        // Fetch the selected storage details
        const storage = await storage_model_1.default.findOne({ storageId }).session(session);
        if (!storage) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: "Storage plan not found." });
            return;
        }
        // Calculate total amount
        const amount = storage.price * (totalStorage / storage.size);
        // Fetch the user's wallet
        const wallet = await wallet_model_1.default.findOne({ userId: userId }).session(session);
        if (!wallet) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: "User wallet not found." });
            return;
        }
        // Check if the user has sufficient funds
        if (wallet.balance < amount) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Insufficient wallet balance to purchase storage." });
            return;
        }
        // Deduct balance from wallet
        wallet.balance -= amount;
        // Add transaction history for the wallet
        wallet.transactions.push({
            type: "withdrawal",
            amount,
            description: `Storage purchase for ${(0, Helpers_1.formatStorageSize)(totalStorage)}`,
            timestamp: new Date(),
            status: "completed",
        });
        await wallet.save({ session });
        const inflowAmount = new inflow_model_1.InflowAmount({
            userId,
            amount,
            description: `Storage purchase for ${(0, Helpers_1.formatStorageSize)(totalStorage)}`,
            transactionType: "storage_purchase",
            purchasedBy: `${user?.firstName} ${user?.lastName}`,
        });
        await inflowAmount.save({ session });
        await financialSummary_model_1.FinancialSummary.updateSummary();
        // Check if user already purchased this storage plan
        const existingPurchase = await subscription_model_1.default.findOne({ user: userId, storage: storageId });
        if (existingPurchase) {
            // Update existing purchase
            existingPurchase.totalStorage += storage.size;
            existingPurchase.amount += storage.price;
            await existingPurchase.save();
        }
        else {
            // Create new purchase record
            const newPurchase = new subscription_model_1.default({
                user: userId,
                storage: storageId,
                totalStorage: storage.size,
                usedStorage: 0,
                amount: storage.price,
                status: "active",
            });
            await newPurchase.save();
        }
        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Storage purchased successfully",
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error("Error purchasing storage:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
    finally {
        session.endSession();
    }
};
exports.purchaseStorage = purchaseStorage;
const checkAvailableStorage = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
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
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_subscription"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
            return;
        }
        const purchases = await subscription_model_1.default.find({ user: userId });
        const totalStorage = purchases.reduce((sum, purchase) => sum + purchase.totalStorage, 0);
        const usedStorage = purchases.reduce((sum, purchase) => sum + purchase.usedStorage, 0);
        const remainingStorage = totalStorage - usedStorage;
        res.status(200).json({
            success: true,
            data: {
                totalStorage: (0, Helpers_1.formatStorageSize)(totalStorage),
                usedStorage: (0, Helpers_1.formatStorageSize)(usedStorage),
                remainingStorage: (0, Helpers_1.formatStorageSize)(remainingStorage),
            },
        });
    }
    catch (error) {
        console.error("Error checking available storage:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.checkAvailableStorage = checkAvailableStorage;
const deleteStoragePurchase = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { purchaseId } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
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
            res.status(403).json({ error: "Only system owners can delete purchased storage", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_subscription"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
            return;
        }
        const deletedPurchase = await subscription_model_1.default.findByIdAndDelete(purchaseId);
        if (!deletedPurchase) {
            res.status(404).json({ success: false, message: "Storage purchase not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Storage purchase deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting storage purchase:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.deleteStoragePurchase = deleteStoragePurchase;
const getUserStoragePurchases = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_subscription"));
        if (!hasPermission) {
            res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
            return;
        }
        const purchases = await subscription_model_1.default.find({ user: userId }).populate("storage");
        res.status(200).json({ success: true, data: purchases });
    }
    catch (error) {
        console.error("Error fetching user storage purchases:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.getUserStoragePurchases = getUserStoragePurchases;
const getStoragePurchaseById = async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_subscription"));
        if (!hasPermission) {
            res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
            return;
        }
        const purchase = await subscription_model_1.default.findById(purchaseId).populate("storage");
        if (!purchase) {
            res.status(404).json({ success: false, message: "Storage purchase not found" });
            return;
        }
        res.status(200).json({ success: true, data: purchase });
    }
    catch (error) {
        console.error("Error fetching storage purchase:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.getStoragePurchaseById = getStoragePurchaseById;
