import { User } from "../models/user.model";
import { InflowAmount } from "../models/inflow.model";
import { Response } from "express";
import { AuthenticatedRequest, IRole } from "../types/types";
import { isSystemOwner } from "../middlewares/isSystemOwner";

export const getAllInflowAmounts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { amount, purchased_by, page = "1", limit = "10" } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized: No user found" });
      return;
    }

    // Fetch user and populate roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

 // Check if the user is a system owner
        if (!isSystemOwner(userId)) {
            res.status(403).json({ error: "Only system owners read all inflows", status: false });
            return;
        }    
    

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("read_inflows"));
    if (!hasPermission) {
      res.status(403).json({ success: false, message: "You're not permitted to view inflows" });
      return;
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Construct query filters
    const query: any = {};
    if (amount) query.amount = amount;
    
    if (purchased_by) {
      // Find users matching the name and get their IDs
      const users = await User.find({ firstName: { $regex: purchased_by, $options: "i" } }, "_id");
      query.userId = { $in: users.map((u) => u._id) };
    }

    // Fetch inflow amounts with pagination, sorting, and optional filters
    const inflowAmounts = await InflowAmount.find(query)
      .populate("userId", "email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Count total records for pagination info
    const totalRecords = await InflowAmount.countDocuments(query);

    res.status(200).json({
      success: true,
      data: inflowAmounts,
      pagination: {
        totalRecords,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching inflow amounts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
