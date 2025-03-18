import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import Role from "../models/role.model";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config/env";

interface AuthRequest extends Request {
    user?: any;
}

export const authProtect = async (req: AuthRequest, res: Response, next: NextFunction):Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded: any = jwt.verify(token, JWT_SECRET_KEY as string);
            req.user = await User.findById(decoded.id).select("-password").populate("roles");

            if (!req.user) {
                res.status(401).json({ message: "Not authorized, user not found" });
                return 
            }

            return next();
        } catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
            return 
        }
    } else {
       res.status(401).json({ message: "Not authorized, no token" });
       return 
    }
};


export const authorize = (...requiredPermissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Not authorized" });
                return;
            }

            // Fetch roles associated with the user
            const userRoles = await Role.find({ _id: { $in: req.user.roles } });

            // Extract all permissions from assigned roles
            const userPermissions = new Set(userRoles.flatMap(role => role.permissions));

            // Check if user has at least one required permission
            const hasPermission = requiredPermissions.some(permission => userPermissions.has(permission));

            if (!hasPermission) {
                res.status(403).json({ message: "Forbidden: Access denied" });
                return;
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
};

