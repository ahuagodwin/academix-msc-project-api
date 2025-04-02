"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
if (!env_1.DB_URL) {
    throw new Error("Please define a DB_URL environment variable inside .env.<development/production>.local");
}
const connect = async () => {
    try {
        await mongoose_1.default.connect(env_1.DB_URL);
        console.log(`connected successfully in ${env_1.NODE_ENV} mode`);
    }
    catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
};
exports.connect = connect;
