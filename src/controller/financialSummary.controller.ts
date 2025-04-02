
import { FinancialSummary } from "../models/financialSummary.model";
import { Response } from "express";
import { AuthenticatedRequest, IRole } from "../types/types";
import { User } from "../models/user.model";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { buildQuery, paginate, paginateResults } from "../helpers/Helpers";
import { OutflowAmount } from "../models/outflow.model";

export const getFinancialSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {

    const userId = req.user?._id

    if(!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
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
                res.status(403).json({ error: "Only system owners read all financial summary", status: false });
                return;
            }    
        
    
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_financial_summary"));
        if (!hasPermission) {
          res.status(403).json({ success: false, message: "You're not permitted to view financial summary" });
          return;
        }

    const summary = await FinancialSummary.findOne();
    if (!summary) {
      res.status(404).json({ success: false, message: "No financial summary found" });
      return;
    }

    res.status(200).json({
      success: true,
      totalInflowAmount: summary.totalInflowAmount,
      totalOutflowAmount: summary.totalOutflowAmount,
      netBalance: summary.netBalance,
      lastUpdated: summary.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const getOutflowSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {

try {
  const userId = req.user?._id;

  const { page, limit, ...filters } = req.query;

  // Use pagination utility
  const { pageNumber, limitNumber, skip } = paginate(page, limit);
  const query = buildQuery(filters);

  if(!userId) {
    res.json()
  }

  if(!userId) {
    throw new Error("Unauthorized access");
  }

  // Fetch user and populate roles
  const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
  if (!user) {
    throw new Error("User not found");
  }

  // Check if the user is a system owner
  if (!isSystemOwner(userId)) {
    throw new Error("Only system owners read all financial summary");
  }

  // Check user permissions
  const hasPermission = user.roles.some((role) => role.permissions.includes("read_financial_summary"));
  if (!hasPermission) {
    throw new Error("You're not permitted to view financial summary");
  }

  const summary = await OutflowAmount.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNumber);

// Count total records for pagination info
const totalRecords = await OutflowAmount.countDocuments(query);

  if (!summary) {
    throw new Error("No outflow summary found");
  }

  res.status(200).json({
    success: true,
    message: "Outflow summary retrieved successfully",
    data: summary,
    pagination: paginateResults(totalRecords, pageNumber, limitNumber),
  });

} catch(error: any) {
  console.error("Error fetching outflow summary:", error);
  throw new Error("Internal Server Error");
}
}