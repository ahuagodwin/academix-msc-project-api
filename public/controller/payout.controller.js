"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flutterwaveWebhook = exports.payOut = void 0;
const axios_1 = __importDefault(require("axios"));
const outflow_model_1 = require("../models/outflow.model");
const financialSummary_model_1 = require("../models/financialSummary.model");
const env_1 = require("../config/env");
const payOut = async (req, res) => {
    try {
        const { amount, account_number, bank_code, description } = req.body;
        if (!amount || amount <= 0 || !account_number || !bank_code) {
            res.status(400).json({ success: false, message: "Invalid withdrawal details" });
            return;
        }
        // Fetch the latest financial summary
        const summary = await financialSummary_model_1.FinancialSummary.findOne();
        if (!summary) {
            res.status(404).json({ success: false, message: "Financial summary not found" });
            return;
        }
        if (amount > summary.totalInflowAmount) {
            res.status(400).json({ success: false, message: "Insufficient funds" });
            return;
        }
        // Initiate Flutterwave transfer
        const transferData = {
            account_bank: bank_code, // Bank code (e.g., "044" for Access Bank)
            account_number: account_number, // Recipient's account number
            amount: amount,
            currency: "NGN", // Change if necessary
            narration: description || "Withdrawal",
            reference: `FLW_${Date.now()}`, // Unique reference
            callback_url: `${env_1.ACADEMIX_FLW_WEB_HOOK_URL}`,
            debit_currency: "NGN",
        };
        const flwResponse = await axios_1.default.post(`${env_1.FLW_TRANSFER_API_URL}`, transferData, {
            headers: {
                Authorization: `Bearer ${env_1.FLW_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });
        // Check if the transfer was successful
        if (flwResponse.data.status !== "success") {
            res.status(400).json({ success: false, message: "Flutterwave transfer failed", data: flwResponse.data });
            return;
        }
        // Create a new outflow transaction
        const outflow = new outflow_model_1.OutflowAmount({
            amount,
            description,
            recipient_account: account_number,
            recipient_bank: bank_code,
            transaction_reference: transferData.reference,
            status: "pending", // Will be updated based on Flutterwave webhook response
            timestamp: new Date(),
        });
        await outflow.save();
        // Update financial summary
        await financialSummary_model_1.FinancialSummary.updateSummary();
        res.status(200).json({
            success: true,
            message: "Withdrawal initiated successfully",
            data: {
                transfer_details: flwResponse.data,
                outflow_transaction: outflow,
            },
        });
    }
    catch (error) {
        console.error("Error withdrawing amount:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
exports.payOut = payOut;
// payout webhook
const flutterwaveWebhook = async (req, res) => {
    try {
        const event = req.body;
        if (event.event === "transfer.completed") {
            // Update the Outflow transaction status
            await outflow_model_1.OutflowAmount.findOneAndUpdate({ transaction_reference: event.data.reference }, { status: "completed" });
        }
        res.status(200).json({ status: "success" });
    }
    catch (error) {
        console.error("Error handling webhook:", error.message);
        res.status(500).json({ success: false, message: "Webhook processing failed" });
    }
};
exports.flutterwaveWebhook = flutterwaveWebhook;
