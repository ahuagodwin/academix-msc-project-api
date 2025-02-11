import { Request, Response } from "express";
import User from "../models/user.Model";
import { Role } from "../models/roles.model";

enum UserPermissions {
    READ = "read",
    WRITE = "write",
    DELETE = "delete",
    UPDATE = "update"
  }

  enum UserRole {
    LECTURER = "teacher",
    ADMIN = "admin",
    STUDENT = "student",
    STAFF = "staff"
  }

  export const updateUserRoleAndPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params; 
      const { role, permissions } = req.body; 
  
      // Check if the user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ status: false, message: "User not found" });
        return;
      }
  
      // Validate the provided role
      if (!Object.values(UserRole).includes(role as UserRole)) {
        res.status(400).json({ status: false, message: "Invalid role provided" });
        return;
      }
  
      // Validate Permissions (ensure they are valid enums)
      if (permissions && Array.isArray(permissions)) {
        const isValidPermissions = permissions.every((perm: string) =>
          Object.values(UserPermissions).includes(perm as UserPermissions)
        );
  
        if (!isValidPermissions) {
          res.status(400).json({ status: false, message: "Invalid permissions provided" });
          return;
        }
      }
  
      // Check if the user already has a role assigned
      let userRole = await Role.findOne({ user: user.id });
  
      if (!userRole) {
        // If no role exists, create a new role
        userRole = await Role.create({
          user: user.id,
          name: role,
          permissions: permissions || [UserPermissions.READ], // Default permission
        });
      } else {
        // Update the existing role
        userRole.name = role;
        userRole.permissions = permissions || userRole.permissions;
        await userRole.save();
      }
  
      // Update user's role reference
      user.role = userRole.roleId;
      await user.save();
  
      res.status(200).json({
        status: true,
        message: "User role and permissions updated successfully",
        data: { userId: user.id, role: userRole.name, permissions: userRole.permissions },
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  };
  
