"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialSummary = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const inflow_model_1 = require("./inflow.model");
const outflow_model_1 = require("./outflow.model");
const FinancialSummarySchema = new mongoose_1.Schema({
    totalInflowAmount: { type: Number, required: true, default: 0 },
    totalOutflowAmount: { type: Number, required: true, default: 0 },
    netBalance: { type: Number, required: true, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
});
// **Update the financial summary whenever transactions occur**
FinancialSummarySchema.statics.updateSummary = async function () {
    try {
        // Calculate total inflow
        const inflowResult = await inflow_model_1.InflowAmount.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        const totalInflow = inflowResult.length > 0 ? inflowResult[0].total : 0;
        // Calculate total outflow
        const outflowResult = await outflow_model_1.OutflowAmount.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        const totalOutflow = outflowResult.length > 0 ? outflowResult[0].total : 0;
        // Calculate net balance
        const netBalance = totalInflow - totalOutflow;
        // Find and update existing summary or create a new one
        const summary = await exports.FinancialSummary.findOne();
        if (summary) {
            summary.totalInflowAmount = totalInflow;
            summary.totalOutflowAmount = totalOutflow;
            summary.netBalance = netBalance;
            summary.lastUpdated = new Date();
            await summary.save();
        }
        else {
            await exports.FinancialSummary.create({
                totalInflowAmount: totalInflow,
                totalOutflowAmount: totalOutflow,
                netBalance,
            });
        }
    }
    catch (error) {
        console.error("Error updating financial summary:", error);
    }
};
exports.FinancialSummary = mongoose_1.default.model("FinancialSummary", FinancialSummarySchema);
