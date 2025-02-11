import { Request, Response } from "express";
import mongoose from "mongoose";
import AuditLogModel from "../models/auditLog.model";

// Handler function
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-timestamp", // Default sorting by logs timestamp
      userId,
      action,
      status,
    } = req.query;

    const filters: { [key: string]: any } = {};

    // Validate page and limit values
    if (page && (isNaN(Number(page)) || Number(page) <= 0)) {
      res.status(400).json({ status: false, message: "Invalid page number" });
      return 
    }

    if (limit && (isNaN(Number(limit)) || Number(limit) <= 0)) {
      res.status(400).json({ status: false, message: "Invalid limit" });
      return 
    }

    // Validate MongoDB ObjectId if userId is provided
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId as string)) {
        res.status(400).json({
          status: false,
          message: "Invalid userId format. Must be a valid ObjectId.",
        });
        return 
      }
    }

    // Adding filters dynamically based on query parameters
    if (userId) filters.userId = new mongoose.Types.ObjectId(userId as string);
    if (action) filters.action = { $regex: action, $options: "i" }; 
    if (status) filters.status = status;

    // Pagination settings
    const skip = (Number(page) - 1) * Number(limit);

    // Query the database
    const auditLogs = await AuditLogModel.find(filters)
      .sort(sort as string)
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "firstName lastName email");

    // Counting total documents for pagination metadata
    const totalLogs = await AuditLogModel.countDocuments(filters);

    // If no logs are found
    if (auditLogs.length === 0) {
      res.status(404).json({
        status: false,
        message: "No audit logs found for the given criteria.",
      });
      return 
    }

    res.status(200).json({
      status: true,
      message: `Successfully retrieved ${auditLogs.length} audit logs.`,
      data: auditLogs,
      pagination: {
        total: totalLogs,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalLogs / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Failed to retrieve audit logs:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve audit logs.",
      error: error.message,
    });
  }
};

export default {
  getAuditLogs,
};
