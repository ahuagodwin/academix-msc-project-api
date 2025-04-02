"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSystemOwner = void 0;
const user_model_1 = require("../models/user.model");
/**
 * @desc Middleware to check if user is a System Owner
 */
const isSystemOwner = async (userId) => {
    const user = await user_model_1.User.findById(userId).populate("roles");
    if (!user)
        return false;
    return user.roles.some((role) => role?.name === "System Owner");
};
exports.isSystemOwner = isSystemOwner;
