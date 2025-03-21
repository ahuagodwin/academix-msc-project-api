import mongoose from "mongoose";
import { DB_URL, NODE_ENV } from "../config/env";

if (!DB_URL) {
    throw new Error("Please define a DB_URL environment variable inside .env.<development/production>.local");
}

const connect = async () => {
    try {
        await mongoose.connect(DB_URL as string);
        console.log(`connected successfully in ${NODE_ENV} mode`);
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
};

export { connect };
