import { buildQuery, paginate, paginateResults } from "../helpers/Helpers";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { Transaction } from "../models/transactions.model";
import { User } from "../models/user.model";
import { AuthenticatedRequest, IRole } from "../types/types";
import { Response } from "express";


export const getAllTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }
  
      // Find user and check roles
      const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
      if (!user) {
        res.status(404).json({ error: "User not found", status: false });
        return;
      }
  
      // Check if user is either a system owner or has view_transaction permission
      const isOwner = isSystemOwner(userId);
      const hasPermission = user.roles.some((role) => role.permissions.includes("view_transaction"));
  
      if (!isOwner && !hasPermission) {
        res.status(403).json({ error: "You're not permitted to view all transactions", status: false });
        return;
      }
  
      // Extract query parameters
      const { page, limit, status, startDate, endDate, ...filters } = req.query;
      
      // Build query filters
      const query: any = buildQuery(filters, ["transactionReference"]);
      
      // Add status filter if provided
      if (status && ["pending", "completed", "failed"].includes(status as string)) {
        query.status = status;
      }
      
      // Add date range filter if provided
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate as string);
        }
      }
  
      // Apply pagination
      const { pageNumber, limitNumber, skip } = paginate(page, limit);
      
      // Get total count of matching records
      const totalRecords = await Transaction.countDocuments(query);
  
      // Fetch transactions
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .select("-__v")
        .populate("userId", "firstName lastName email");
  
      res.status(200).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: transactions,
        pagination: paginateResults(totalRecords, pageNumber, limitNumber),
      });
    } catch (error) {
      console.error("Fetch All Transactions Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };


  export const getUserTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const authenticatedUserId = req.user?._id;
      const requestedUserId = req.params.userId;
  
      if (!authenticatedUserId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }
  
      // Find user and check roles
      const user = await User.findById(authenticatedUserId).populate<{ roles: IRole[] }>("roles");
      if (!user) {
        res.status(404).json({ error: "User not found", status: false });
        return;
      }
  
      // Check if the authenticated user is requesting their own transactions or has proper permissions
      const isOwnTransactions = authenticatedUserId.toString() === requestedUserId;
      const isOwner = isSystemOwner(authenticatedUserId);
      const hasPermission = user.roles.some((role) => role.permissions.includes("view_transaction"));
  
      if (!isOwnTransactions && !isOwner && !hasPermission) {
        res.status(403).json({ error: "You're not permitted to view these transactions", status: false });
        return;
      }
  
      // Verify the requested user exists
      const requestedUser = await User.findById(requestedUserId);
      if (!requestedUser) {
        res.status(404).json({ success: false, message: "Requested user not found" });
        return;
      }
  
      // Extract query parameters
      const { page, limit, status, startDate, endDate, ...filters } = req.query;
      
      // Build query filters
      const query: any = buildQuery(filters, ["transactionReference"]);
      
      // Set userId filter to the requested user
      query.userId = requestedUserId;
      
      // Add status filter if provided
      if (status && ["pending", "completed", "failed"].includes(status as string)) {
        query.status = status;
      }
      
      // Add date range filter if provided
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate as string);
        }
      }
  
      // Apply pagination
      const { pageNumber, limitNumber, skip } = paginate(page, limit);
      
      // Get total count of matching records
      const totalRecords = await Transaction.countDocuments(query);
  
      // Fetch transactions
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .select("-__v")
        .populate("userId", "firstName lastName email");
  
      res.status(200).json({
        success: true,
        message: "User transactions retrieved successfully",
        data: transactions,
        pagination: paginateResults(totalRecords, pageNumber, limitNumber),
      });
    } catch (error) {
      console.error("Fetch User Transactions Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };