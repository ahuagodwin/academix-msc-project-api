"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authProtect = void 0;
const user_model_1 = require("../models/user.model");
const role_model_1 = __importDefault(require("../models/role.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const authProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET_KEY);
            req.user = await user_model_1.User.findById(decoded.id).select("-password").populate("roles");
            if (!req.user) {
                res.status(401).json({ message: "Not authorized, user not found" });
                return;
            }
            return next();
        }
        catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
            return;
        }
    }
    else {
        res.status(401).json({ message: "Not authorized, no token" });
        return;
    }
};
exports.authProtect = authProtect;
const authorize = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Not authorized" });
                return;
            }
            // Fetch roles associated with the user
            const userRoles = await role_model_1.default.find({ _id: { $in: req.user.roles } });
            // Extract all permissions from assigned roles
            const userPermissions = new Set(userRoles.flatMap(role => role.permissions));
            // Check if user has at least one required permission
            const hasPermission = requiredPermissions.some(permission => userPermissions.has(permission));
            if (!hasPermission) {
                res.status(403).json({ message: "Forbidden: Access denied" });
                return;
            }
            next();
        }
        catch (error) {
            console.error("Authorization error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
};
exports.authorize = authorize;
