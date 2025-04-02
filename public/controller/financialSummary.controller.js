"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutflowSummary = exports.getFinancialSummary = void 0;
const financialSummary_model_1 = require("../models/financialSummary.model");
const user_model_1 = require("../models/user.model");
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const Helpers_1 = require("../helpers/Helpers");
const outflow_model_1 = require("../models/outflow.model");
const getFinancialSummary = async (req, res) => {
    try {
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
        // Check if the user is a system owner
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            res.status(403).json({ error: "Only system owners read all financial summary", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_financial_summary"));
        if (!hasPermission) {
            res.status(403).json({ success: false, message: "You're not permitted to view financial summary" });
            return;
        }
        const summary = await financialSummary_model_1.FinancialSummary.findOne();
        if (!summary) {
            res.status(404).json({ success: false, message: "No financial summary found" });
            return;
        }
        res.status(200).json({
            success: true,
            totalInflowAmount: summary.totalInflowAmount,
            totalOutflowAmount: summary.totalOutflowAmount,
            netBalance: summary.netBalance,
            lastUpdated: summary.lastUpdated,
        });
    }
    catch (error) {
        console.error("Error fetching financial summary:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.getFinancialSummary = getFinancialSummary;
const getOutflowSummary = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { page, limit, ...filters } = req.query;
        // Use pagination utility
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        const query = (0, Helpers_1.buildQuery)(filters);
        if (!userId) {
            res.json();
        }
        if (!userId) {
            throw new Error("Unauthorized access");
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            throw new Error("User not found");
        }
        // Check if the user is a system owner
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            throw new Error("Only system owners read all financial summary");
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_financial_summary"));
        if (!hasPermission) {
            throw new Error("You're not permitted to view financial summary");
        }
        const summary = await outflow_model_1.OutflowAmount.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNumber);
        // Count total records for pagination info
        const totalRecords = await outflow_model_1.OutflowAmount.countDocuments(query);
        if (!summary) {
            throw new Error("No outflow summary found");
        }
        res.status(200).json({
            success: true,
            message: "Outflow summary retrieved successfully",
            data: summary,
            pagination: (0, Helpers_1.paginateResults)(totalRecords, pageNumber, limitNumber),
        });
    }
    catch (error) {
        console.error("Error fetching outflow summary:", error);
        throw new Error("Internal Server Error");
    }
};
exports.getOutflowSummary = getOutflowSummary;
