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
const types_1 = require("../types/types"); // Import StorageStatus Enum
const storagePurchaseSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User", required: true },
    storage: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Storage", required: true },
    totalStorage: {
        type: Number,
        required: true,
        min: [1, "Total storage must be greater than 0."]
    },
    amount: {
        type: Number,
        required: true,
        min: [0, "Amount must be a positive number."]
    },
    usedStorage: {
        type: Number,
        default: 0,
        min: [0, "Used storage cannot be negative."],
        validate: {
            validator: function (value) {
                return value <= this.totalStorage;
            },
            message: "Used storage cannot exceed total storage size.",
        },
    },
    purchasedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: Object.values(types_1.StorageStatus),
        default: types_1.StorageStatus.active
    },
}, { timestamps: true });
// Middleware to update storage status dynamically
storagePurchaseSchema.pre("save", function (next) {
    if (this.usedStorage < 0) {
        return next(new Error("Used storage cannot be negative."));
    }
    const usagePercentage = (this.usedStorage / this.totalStorage) * 100;
    if (this.usedStorage >= this.totalStorage) {
        this.status = types_1.StorageStatus.exhausted;
    }
    else if (usagePercentage >= 80) {
        this.status = types_1.StorageStatus.low;
    }
    else {
        this.status = types_1.StorageStatus.active;
    }
    next();
});
// Create the model
const StoragePurchase = mongoose_1.default.model("StoragePurchase", storagePurchaseSchema);
exports.default = StoragePurchase;
