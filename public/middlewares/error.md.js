"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    try {
        let error = { ...err };
        error.message = err.message;
        // Mongoose bad ObjectId
        if (err.name === "CastError") {
            const message = "Resource not found";
            error = new Error(message);
            error.status = 404;
        }
        // Mongoose duplicate key
        if (err.code === 11000) {
            const message = "Duplicate field value entered";
            error = new Error(message);
            error.status = 400;
        }
        // Mongoose validation error
        if (err.name === "ValidationError") {
            const message = Object.values(err.errors).map((val) => val.message);
            error = new Error(message.join(", "));
            error.status = 409;
        }
        // Default error status
        if (!error.status) {
            error.status = 500;
        }
        // Send error response
        res.status(error.status).json({
            success: false,
            message: error?.message || "An error occurred",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.errorHandler = errorHandler;
