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
const mongoose_1 = __importStar(require("mongoose"));
// Define Transaction Schema
const transactionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["deposit", "withdrawal"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
}, { _id: false });
// Define Wallet Schema
const walletSchema = new mongoose_1.Schema({
    balance: {
        type: Number,
        default: 0.0,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    currency: {
        type: String,
        default: "NGN",
    },
    transactions: [transactionSchema], // Explicitly defining transactions
}, {
    timestamps: true,
});
// **Deposit Money**
walletSchema.methods.deposit = async function (amount, description = "Deposit") {
    if (amount <= 0)
        throw new Error("Deposit amount must be greater than zero.");
    this.balance += amount;
    this.transactions.push({
        type: "deposit",
        amount,
        description,
        timestamp: new Date(),
        status: "completed", // Auto-complete deposit
    });
    await this.save();
};
// **Withdraw Money**
walletSchema.methods.withdraw = async function (amount, description = "Withdrawal") {
    if (amount <= 0)
        throw new Error("Withdrawal amount must be greater than zero.");
    if (this.balance < amount)
        throw new Error("Insufficient funds.");
    this.balance -= amount;
    this.transactions.push({
        type: "withdrawal",
        amount,
        description,
        timestamp: new Date(),
        status: "pending", // Keep pending until processed
    });
    await this.save();
    return true;
};
// Export the Wallet model
const Wallet = mongoose_1.default.model("Wallet", walletSchema);
exports.default = Wallet;
