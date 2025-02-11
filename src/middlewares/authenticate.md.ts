import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.Model";
import { getEnvVariable } from "../utils/utils";

// Middleware to authenticate a user by verifying the JWT token
export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get the authorization header
    const authorizationHeader = req.headers.authorization;

    // If no authorization header or it doesn't start with "Bearer", return an error
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
     res.status(401).json({
        status: false,
        message: "Authorization header must start with 'Bearer '.",
      });
      return 
    }

    // Extract the token from the Authorization header
    const token = authorizationHeader.split(" ")[1];

    // If no token is found, return an error
    if (!token) {
      res.status(401).json({
        status: false,
        message: "Access token is required.",
      });
      return 
    }

    try {
      // Verify the token and decode it
      const decoded: any = jwt.verify(token, getEnvVariable("JWT_SECRET_KEY"));

      // Fetch the user from the database using the decoded ID
      const user = await User.findOne(decoded.id);
      console.log(" authenticated user:", user);

      // If no user is found, return an error
      if (!user) {
        res.status(401).json({
          status: false,
          message: "User not found.",
        });
        return 
      }

      // If the user is blocked, return a forbidden error
      if (user.isBlocked) {
        res.status(403).json({
          status: false,
          message: "Your account is blocked due to too many attempts.",
        });
        return 
      }

      // Attach the user to the request object for future use
      req.user = user as IUser;

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error("JWT Error:", error); // Log any JWT verification issues

      // If JWT is invalid or expired, return an error
      res.status(401).json({
        status: false,
        message: "Invalid or expired access token.",
      });
      return 
    }
  }
);
