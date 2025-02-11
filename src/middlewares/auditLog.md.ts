import { Request, Response, NextFunction } from "express";
import AuditLogModel from "../models/auditLog.model";
import User from "../models/user.Model"; 
import { getLocationFromIp, getPublicIp } from "../config/geoLocation";
import mongoose from "mongoose";

interface AuditLogOptions {
  action: string;
  userId?: string;
  status?: string;
}

export const auditLogMiddleware = (options: AuditLogOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", async () => {
      try {
        let ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        if (ipAddress === "::1" || ipAddress === "127.0.0.1") {
          ipAddress = await getPublicIp();
        }
        const ipAddressString = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
        const location = await getLocationFromIp(ipAddressString);
        const userAgent = req.headers["user-agent"] || "Unknown";

        const userId = options.userId || (req?.user ? req?.user._id : null); // Use null for unknown user

        let user = null;
        if (userId) {
          user = await User.findById(userId).select("firstName lastName email");
        }

        const status = options.status || res.statusCode.toString();

        await AuditLogModel.create({
          userId,
          action: options.action,
          status,
          ipAddress: ipAddressString,
          location, 
          userAgent,
          firstName: user ? user.firstName : null,
          lastName: user ? user.lastName : null,
          email: user ? user.email : null,
        });

      } catch (error) {
        console.error("Failed to save audit log:", error);
        if (error instanceof mongoose.Error.ValidationError) {
          console.error("Validation Error Details:", error.errors);
        }
      }
    });

    next();
  };
};
