import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    try {
        let error = { ...err };
        error.message = err.message;

        // Mongoose bad ObjectId
        if (err.name === "CastError") {
            const message = "Resource not found";
            error = new Error(message);
            (error as any).status = 404;
        }

        // Mongoose duplicate key
        if (err.code === 11000) {
            const message = "Duplicate field value entered";
            error = new Error(message);
            (error as any).status = 400;
        }

        // Mongoose validation error
        if (err.name === "ValidationError") {
            const message = Object.values(err.errors).map((val: any) => val.message);
            error = new Error(message.join(", "));
            (error as any).status = 409;
        }

        // Default error status
        if (!(error as any).status) {
            (error as any).status = 500;
        }

        // Send error response
        res.status((error as any).status).json({
            success: false,
            message: error?.message || "An error occurred",
        });
    } catch (error) {
        next(error);
    }
};

export { errorHandler  };
