import { buildQuery, paginate, paginateResults } from "../helpers/Helpers";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { User } from "../models/user.model";
import Wallet from "../models/wallet.model";
import { AuthenticatedRequest, IRole } from "../types/types";
import { Response } from "express";

export const getWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }
  
      // Find user's wallet
      const wallet = await Wallet.findOne({ userId }).populate("userId", "firstName lastName email");
  
      // If wallet doesn't exist
      if (!wallet) {
        res.status(404).json({ success: false, message: "Wallet not found" });
        return;
      }
  
      res.status(200).json({
        success: true,
        message: "Wallet retrieved successfully",
        data: wallet,
      });
    } catch (error) {
      console.error("Get Wallet Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  
  export const getWalletTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }
  
      // Find wallet
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        res.status(404).json({ success: false, message: "Wallet not found" });
        return;
      }
  
      // Extract query parameters
      const { page, limit, type, status, startDate, endDate } = req.query;
      
      // Apply pagination
      const { pageNumber, limitNumber, skip } = paginate(page, limit);
      
      // Filter transactions based on query parameters
      let transactions = wallet.transactions;
      
      // Filter by type (deposit/withdrawal)
      if (type && ["deposit", "withdrawal"].includes(type as string)) {
        transactions = transactions.filter(t => t.type === type);
      }
      
      // Filter by status
      if (status && ["pending", "completed", "failed"].includes(status as string)) {
        transactions = transactions.filter(t => t.status === status);
      }
      
      // Filter by date range
      if (startDate) {
        const start = new Date(startDate as string);
        transactions = transactions.filter(t => t.timestamp >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate as string);
        transactions = transactions.filter(t => t.timestamp <= end);
      }
      
      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply pagination to the filtered and sorted transactions
      const paginatedTransactions = transactions.slice(skip, skip + limitNumber);
      
      res.status(200).json({
        success: true,
        message: "Wallet transactions retrieved successfully",
        data: paginatedTransactions,
        pagination: paginateResults(transactions.length, pageNumber, limitNumber),
      });
    } catch (error) {
      console.error("Get Wallet Transactions Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  
  export const getAllWallets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
  
      // Check if user is either a system owner or has view_wallet permission
      const isOwner = isSystemOwner(userId);
      const hasPermission = user.roles.some((role) => role.permissions.includes("view_wallet"));
  
      if (!isOwner && !hasPermission) {
        res.status(403).json({ error: "You're not permitted to view all wallets", status: false });
        return;
      }
  
      // Extract query parameters
      const { page, limit, ...filters } = req.query;
      
      // Build query filters
      const query = buildQuery(filters, ["currency"]);
      
      // Apply pagination
      const { pageNumber, limitNumber, skip } = paginate(page, limit);
      
      // Get total count of matching records
      const totalRecords = await Wallet.countDocuments(query);
  
      // Fetch wallets
      const wallets = await Wallet.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .select("-__v")
        .populate("userId", "firstName lastName email");
  
      res.status(200).json({
        success: true,
        message: "All wallets retrieved successfully",
        data: wallets,
        pagination: paginateResults(totalRecords, pageNumber, limitNumber),
      });
    } catch (error) {
      console.error("Fetch All Wallets Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };