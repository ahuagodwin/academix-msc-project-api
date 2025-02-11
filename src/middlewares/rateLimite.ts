import rateLimit from "express-rate-limit";
import User from "../models/user.Model";
import { validateMongoDbId } from "../config/validateMongoId";
import { Request, Response } from "express";

// Rate limiting middleware
export const requestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limiting each IP to 5 login requests per window
  message: {
    error: "Too many login attempts from this IP. Please try again later in 15 minutes time.",
    status: false,
  },
  standardHeaders: true, // Returning rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disabling the `X-RateLimit-*` headers

  handler: async (req: Request, res:Response, next) => {
    try {
      const userId = req?.user ? req?.user._id : null; 
      validateMongoDbId(userId)
      if (!userId) {
        // Block the user by updating their status in the database
        await User.findByIdAndUpdate(userId, { isBlocked: true }, { new: true });

        console.log(`User with ID ${userId} has been blocked due to too many attempts.`);
      }
      // Respond with a custom message
      res.status(429).json({
        error: "Too many requests. Your account has been temporarily blocked. Please contact the administrator.",
        status: false,
      });
    } catch (error) {
      console.error("Error in rate limit handler:", error);
      next(error);
    }
  },
});
