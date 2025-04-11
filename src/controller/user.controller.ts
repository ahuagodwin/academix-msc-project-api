import { AuthenticatedRequest, IRole } from "../types/types";
import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { User } from "../models/user.model";
import { buildQuery, paginate, paginateResults } from "../helpers/Helpers";

export const getAllUsers = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      const session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        const userId = req.user?._id;
  
        if (!userId) {
          res.status(401).json({ success: false, message: "Unauthorized access" });
          return;
        }
  
        // Fetch the current user with their roles
        const currentUser = await User.findById(userId)
          .populate<{ roles: IRole[] }>("roles")
          .session(session);
  
        if (!currentUser) {
          await session.abortTransaction();
          res.status(404).json({ error: "User not found", status: false });
          return;
        }
  
        // Check if any of the user's roles has the "read_users" permission
        const hasPermission = currentUser.roles.some((role) =>
          role.permissions.includes("read_users")
        );
  
        if (!hasPermission) {
          await session.abortTransaction();
          res.status(403).json({
            error: "You're not permitted to view all users",
            status: false,
          });
          return;
        }
           // extracting query parameters
                    const { page, limit, ...filters } = req.query;
                
                    // applying pagination and filters
                    const { pageNumber, limitNumber, skip } = paginate(page, limit);
                    const query = buildQuery(filters, ["firstName", "lastName"]);
                
                    const totalRecords = await User.countDocuments(query);
  
        // Fetch all users
        const users = await User.find(query)
          .sort({ createdAt: -1})
          .skip(skip)
          .limit(limitNumber)
          .select("-__v")
          .populate("roles", "name description")
          .populate("school", "name")
          .populate("wallet", "balance currency")
          .populate("storage_spaces", "size")
          .select("-password -emailVerificationCode -emailVerificationCodeValidation -refreshToken -passwordChangedAt -_v")
          .session(session);
  
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
  
        res.status(200).json({
          success: true,
          message: "Users retrieved successfully.",
          count: users.length,
          data: users,
          pagination: paginateResults(totalRecords, pageNumber, limitNumber),
        });
  
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
      }
    }
  );