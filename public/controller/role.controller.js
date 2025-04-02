"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssignedRolesToUser = exports.assignRolesToUser = exports.deleteRoleById = exports.updateRoleById = exports.getRoleById = exports.getAllRoles = exports.createRole = void 0;
const role_model_1 = __importDefault(require("../models/role.model"));
const user_model_1 = require("../models/user.model");
const mongoose_1 = __importStar(require("mongoose"));
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const createRole = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { name, description, permissions, routes } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }
        // Ensure roles are populated before checking permissions
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to create roles", status: false });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        // Check if role already exists
        const existingRole = await role_model_1.default.findOne({ name }).session(session);
        if (existingRole) {
            res.status(409).json({ error: `Role "${name}" already exists`, status: false });
            await session.abortTransaction();
            session.endSession();
            return;
        }
        // Create and save the new role
        const newRole = new role_model_1.default({ name, description, permissions, routes });
        await newRole.save({ session });
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ message: `Role "${name}" created successfully`, role: newRole, status: true });
    }
    catch (error) {
        console.error(error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
exports.createRole = createRole;
/**
 * @desc Get all roles (Only users with "read" permission)
 * @access Private
 */
const getAllRoles = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId || !(await (0, isSystemOwner_1.isSystemOwner)(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if the user has "read" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view roles", status: false });
            return;
        }
        const roles = await role_model_1.default.find();
        res.status(200).json({ roles, status: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
exports.getAllRoles = getAllRoles;
/**
 * @desc Get a single role by ID (Only users with "read" permission)
 * @access Private
 */
const getRoleById = async (req, res) => {
    try {
        const { roleId } = req.params;
        const userId = req.user?._id;
        if (!userId || !(await (0, isSystemOwner_1.isSystemOwner)(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if the user has "read" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view role", status: false });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(roleId)) {
            res.status(400).json({ error: "Invalid role ID", status: false });
            return;
        }
        const role = await role_model_1.default.findById(roleId);
        if (!role) {
            res.status(404).json({ error: "Role not found", status: false });
            return;
        }
        res.status(200).json({ role, status: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
exports.getRoleById = getRoleById;
/**
 * @desc Update a role by ID (Only users with "update" permission)
 * @access Private
 */
const updateRoleById = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { roleId } = req.params;
        const { name, description, permissions, routes } = req.body;
        const userId = req.user?._id;
        if (!userId || !(await (0, isSystemOwner_1.isSystemOwner)(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        const roleExists = await role_model_1.default.findById(roleId);
        console.log("Role found:", roleExists);
        // Check if the user has "update" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("update_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to update role", status: false });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(roleId)) {
            res.status(400).json({ error: "Invalid role ID", status: false });
            return;
        }
        const updatedRole = await role_model_1.default.findByIdAndUpdate(roleId, { name, description, permissions, routes }, { new: true, runValidators: true, session });
        if (!updatedRole) {
            res.status(404).json({ error: "Role not found", status: false });
            return;
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "Role updated successfully", role: updatedRole, status: true });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
exports.updateRoleById = updateRoleById;
/**
 * @desc Delete a role by ID (Only users with "delete" permission)
 * @access Private
 */
const deleteRoleById = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { roleId } = req.params;
        const userId = req.user?._id;
        if (!userId || !(await (0, isSystemOwner_1.isSystemOwner)(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check if the user has "delete" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to delete role", status: false });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(roleId)) {
            res.status(400).json({ error: "Invalid role ID", status: false });
            return;
        }
        // Check if any user is assigned to this role
        const usersWithRole = await user_model_1.User.findOne({ roles: roleId });
        if (usersWithRole) {
            res.status(400).json({ error: "Cannot delete role: It is assigned to one or more users.", status: false });
            return;
        }
        const deletedRole = await role_model_1.default.findByIdAndDelete(roleId, { session });
        if (!deletedRole) {
            res.status(404).json({ error: "Role not found", status: false });
            return;
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "Role deleted successfully", status: true });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
exports.deleteRoleById = deleteRoleById;
/**
 * @desc Assign a role to User by user ID and roleIds (Only users with "create" permission)
 * @access Private
 */
const assignRolesToUser = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId, roleIds } = req.body;
        const requestingUserId = req.user?._id;
        // Authentication & system owner check
        if (!requestingUserId || !(0, isSystemOwner_1.isSystemOwner)(requestingUserId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }
        // Validate input
        if (!userId || !roleIds || !Array.isArray(roleIds)) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ error: "Invalid input. Provide userId and an array of roleIds.", status: false });
            return;
        }
        // Validate Role IDs
        const validRoleIds = roleIds.filter((id) => mongoose_1.default.isValidObjectId(id));
        if (validRoleIds.length !== roleIds.length) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ error: "One or more provided roleIds are invalid.", status: false });
            return;
        }
        // Fetch requesting user & validate permissions
        const requestingUser = await user_model_1.User.findById(requestingUserId).populate("roles").session(session);
        if (!requestingUser) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ error: "Requesting user not found", status: false });
            return;
        }
        const hasPermission = requestingUser.roles.some((role) => role.permissions?.includes("create_role"));
        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ error: "You do not have permission to assign roles", status: false });
            return;
        }
        // Fetch target user
        const targetUser = await user_model_1.User.findById(userId).session(session);
        if (!targetUser) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ error: "Target user not found", status: false });
            return;
        }
        // Fetch roles from DB using `_id`
        const roles = await role_model_1.default.find({ roleId: { $in: validRoleIds.map((id) => new mongoose_1.Types.ObjectId(`${id}`)) } }).session(session);
        if (roles.length !== validRoleIds.length) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ error: "One or more roles not found", status: false });
            return;
        }
        // Check if user already has roles
        const existingRoleIds = new Set(targetUser.roles.map((role) => role.toString()));
        const newRoleIds = validRoleIds.filter((roleId) => !existingRoleIds.has(roleId));
        if (newRoleIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ error: "User already has these roles assigned", status: false });
            return;
        }
        // Assign new roles
        targetUser.roles = [...targetUser.roles, ...newRoleIds.map((id) => new mongoose_1.Types.ObjectId(`${id}`))];
        await targetUser.save({ session });
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            message: "Roles assigned successfully",
            user: {
                userId: targetUser._id,
                roles: targetUser.roles
            },
            status: true
        });
    }
    catch (error) {
        console.error(error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
exports.assignRolesToUser = assignRolesToUser;
/**
 * @desc Update Assign role to User by user ID and roleIds (Only users with "create" permission)
 * @access Private
 */
const updateAssignedRolesToUser = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId, roleIds } = req.body;
        const requestingUserId = req.user?._id;
        if (!requestingUserId || !(0, isSystemOwner_1.isSystemOwner)(requestingUserId)) {
            throw { status: 401, message: "Unauthorized access" };
        }
        if (!userId || !roleIds || !Array.isArray(roleIds)) {
            throw { status: 400, message: "Invalid input. Provide userId and an array of roleIds." };
        }
        // Validate userId
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw { status: 400, message: "Invalid userId format." };
        }
        // Validate roleIds
        const validRoleIds = roleIds.filter((id) => mongoose_1.Types.ObjectId.isValid(id));
        if (validRoleIds.length !== roleIds.length) {
            throw { status: 400, message: "One or more roleIds are invalid." };
        }
        // Convert roleIds to ObjectIds
        const roleObjectIds = validRoleIds.map((id) => new mongoose_1.Types.ObjectId(id));
        // Fetch target user
        const targetUser = await user_model_1.User.findById(userId).session(session);
        if (!targetUser) {
            throw { status: 404, message: "Target user not found" };
        }
        // Fetch roles
        const roles = await role_model_1.default.find({ roleId: { $in: roleObjectIds } }).session(session);
        if (roles.length !== roleObjectIds.length) {
            throw { status: 404, message: "Some roles not found." };
        }
        // Assign roles to user
        targetUser.roles = roleObjectIds;
        await targetUser.save({ session });
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({
            message: "Roles updated successfully",
            user: { userId: targetUser._id, roles: targetUser.roles },
            status: true,
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(error.status || 500).json({
            error: error.message || "Internal server error",
            status: false,
        });
    }
};
exports.updateAssignedRolesToUser = updateAssignedRolesToUser;
