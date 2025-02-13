import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/user.Model";
import { Role } from "../models/roles.model";


enum UserPermissions {
  READ = "read",
  CREATE = "create",
  DELETE = "delete",
  UPDATE = "update"
}

// Middleware to authorize users based on role and permissions
export const accessControl = (allowedRoles: string[] = [], requiredPermissions: string[] = []) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(403).json({
        status: false,
        message: "Unauthorized access.",
      });
      return;
    }

    const userId = req.user.id;

    // Fetch the user from the database
    const user = await User.findOne({id: userId});
    if (!user) {
      res.status(404).json({
        status: false,
        message: "User not found.",
      });
      return;
    }

    // Fetch the role associated with the user
    const userRole = await Role.findOne({ roleId: user.role });

    if (!userRole) {
      res.status(403).json({
        status: false,
        message: "User role not found.",
      });
      return;
    }

    // Check if the user's role is allowed
    const hasRole = allowedRoles.length === 0 || allowedRoles.includes(userRole.name);

    // Check if the user has the required permissions
    const hasPermission =
      requiredPermissions.length === 0 ||
      requiredPermissions.every((perm: string) => userRole.permissions.includes(perm as UserPermissions));

    if (!hasRole || !hasPermission) {
      res.status(403).json({
        status: false,
        message: "You do not have permission to perform this action.",
      });
      return;
    }

    next(); // User is authorized, proceed
  });
};
