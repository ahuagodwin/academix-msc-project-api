import { Request, Response } from "express";
import { IRole, IRoute, IUser } from "../types/types";
import Role from "../models/role.model";
import { User } from "../models/user.model";
import mongoose, { Types } from "mongoose";
import { isSystemOwner } from "../middlewares/isSystemOwner";

interface AuthenticatedRequest extends Request {
    user?: IUser;
}

export const createRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession(); 
    session.startTransaction();

    try {
        const { name, description, permissions, routes } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Ensure roles are populated before checking permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);

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
        const existingRole = await Role.findOne({ name }).session(session);
        if (existingRole) {
            res.status(409).json({ error:  `Role "${name}" already exists`, status: false });
            await session.abortTransaction();
            session.endSession();
            return;
        }

        // Create and save the new role
        const newRole = new Role({ name, description, permissions, routes });
        await newRole.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: `Role "${name}" created successfully`, role: newRole, status: true });
    } catch (error) {
        console.error(error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: "Internal server error", status: false });
    }
};


/**
 * @desc Get all roles (Only users with "read" permission)
 * @access Private
 */
export const getAllRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId || !(await isSystemOwner(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
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

        const roles = await Role.find();
        res.status(200).json({ roles, status: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

/**
 * @desc Get a single role by ID (Only users with "read" permission)
 * @access Private
 */
export const getRoleById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { roleId } = req.params;
        const userId = req.user?._id;

        if (!userId || !(await isSystemOwner(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
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

        if (!mongoose.Types.ObjectId.isValid(roleId)) {
            res.status(400).json({ error: "Invalid role ID", status: false });
            return;
        }

        const role = await Role.findById(roleId);
        if (!role) {
            res.status(404).json({ error: "Role not found", status: false });
            return;
        }

        res.status(200).json({ role, status: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

/**
 * @desc Update a role by ID (Only users with "update" permission)
 * @access Private
 */
export const updateRoleById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { roleId } = req.params;
        const { name, description, permissions, routes } = req.body;
        const userId = req.user?._id;



        if (!userId || !(await isSystemOwner(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const roleExists = await Role.findById(roleId);
        console.log("Role found:", roleExists);

        // Check if the user has "update" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("update_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to update role", status: false });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(roleId)) {
            res.status(400).json({ error: "Invalid role ID", status: false });
            return;
        }

        const updatedRole = await Role.findByIdAndUpdate(
            roleId,
            { name, description, permissions, routes },
            { new: true, runValidators: true, session }
        );

        if (!updatedRole) {
            res.status(404).json({ error: "Role not found", status: false });
            return;
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Role updated successfully", role: updatedRole, status: true });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

/**
 * @desc Delete a role by ID (Only users with "delete" permission)
 * @access Private
 */
export const deleteRoleById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { roleId } = req.params;
        const userId = req.user?._id;

        if (!userId || !(await isSystemOwner(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
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

        if (!mongoose.Types.ObjectId.isValid(roleId)) {
            res.status(400).json({ error: "Invalid role ID", status: false });
            return;
        }

         // Check if any user is assigned to this role
         const usersWithRole = await User.findOne({ roles: roleId });
         if (usersWithRole) {
             res.status(400).json({ error: "Cannot delete role: It is assigned to one or more users.", status: false });
             return;
         }

        const deletedRole = await Role.findByIdAndDelete(roleId, { session });
        if (!deletedRole) {
            res.status(404).json({ error: "Role not found", status: false });
            return;
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Role deleted successfully", status: true });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};


/**
 * @desc Assign a role to User by user ID and roleIds (Only users with "create" permission)
 * @access Private
 */
export const assignRolesToUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, roleIds } = req.body;
        const requestingUserId = req.user?._id;

        // Authentication & system owner check
        if (!requestingUserId || !isSystemOwner(requestingUserId)) {
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
        const validRoleIds = roleIds.filter((id) => mongoose.isValidObjectId(id));
        if (validRoleIds.length !== roleIds.length) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ error: "One or more provided roleIds are invalid.", status: false });
            return;
        }

        // Fetch requesting user & validate permissions
        const requestingUser = await User.findById(requestingUserId).populate<{ roles: IRole[] }>("roles").session(session);
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
        const targetUser = await User.findById(userId).session(session);
        if (!targetUser) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ error: "Target user not found", status: false });
            return;
        }

        // Fetch roles from DB using `_id`
        const roles = await Role.find({ roleId: { $in: validRoleIds.map((id) => new Types.ObjectId(`${id}`)) } }).session(session);
        if (roles.length !== validRoleIds.length) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ error: "One or more roles not found", status: false });
            return;
        }

        // Check if user already has roles
        const existingRoleIds = new Set((targetUser.roles as Types.ObjectId[]).map((role) => role.toString()));
        const newRoleIds = validRoleIds.filter((roleId) => !existingRoleIds.has(roleId));

        if (newRoleIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ error: "User already has these roles assigned", status: false });
            return;
        }

        // Assign new roles
        targetUser.roles = [...(targetUser.roles as Types.ObjectId[]), ...newRoleIds.map((id) => new Types.ObjectId(`${id}`))];
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

    } catch (error) {
        console.error(error);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

/**
 * @desc Update Assign role to User by user ID and roleIds (Only users with "create" permission)
 * @access Private
 */
export const updateAssignedRolesToUser = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, roleIds } = req.body;
        const requestingUserId = req.user?._id;

        if (!requestingUserId || !isSystemOwner(requestingUserId)) {
            throw { status: 401, message: "Unauthorized access" };
        }

        if (!userId || !roleIds || !Array.isArray(roleIds)) {
            throw { status: 400, message: "Invalid input. Provide userId and an array of roleIds." };
        }

        // Validate userId
        if (!Types.ObjectId.isValid(userId)) {
            throw { status: 400, message: "Invalid userId format." };
        }

        // Validate roleIds
        const validRoleIds = roleIds.filter((id: string) => Types.ObjectId.isValid(id));

        if (validRoleIds.length !== roleIds.length) {
            throw { status: 400, message: "One or more roleIds are invalid." };
        }

        // Convert roleIds to ObjectIds
        const roleObjectIds = validRoleIds.map((id: string) => new Types.ObjectId(id));

        // Fetch target user
        const targetUser = await User.findById(userId).session(session);
        if (!targetUser) {
            throw { status: 404, message: "Target user not found" };
        }

        // Fetch roles
        const roles = await Role.find({ roleId: { $in: roleObjectIds } }).session(session);
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
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        res.status(error.status || 500).json({
            error: error.message || "Internal server error",
            status: false,
        });
    }
};



/**
 * @desc Get all users that have been assigned any roles
 * @access Private
 */
export const getAllUsersWithRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?._id;

    try {
        // Check if the user is authenticated and is a system owner
        if (!userId || !(await isSystemOwner(userId))) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return 
        }

        // Fetch the requesting user and their roles
        const requestingUser = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!requestingUser) {
            res.status(404).json({ error: "Requesting user not found", status: false });
            return
        }

        // Check if the requesting user has "read_assigned_role" permission
        const hasPermission = requestingUser.roles.some((role) => role.permissions.includes("read_role"));
        if (!hasPermission) {
            res.status(403).json({ error: "You're not permitted to view users with assigned roles", status: false });
            return
        }

        // Fetch all users with their assigned roles
        const users = await User.find({ roles: { $exists: true, $not: { $size: 0 } } })
            .populate<{ roles: IRole[] }>("roles");

        if (users.length === 0) {
            res.status(404).json({ error: "No users with assigned roles found", status: false });
            return
        }

        // Return the users along with their roles
        res.status(200).json({
            message: "Users with assigned roles fetched successfully",
            users: users.map(user => ({
                userId: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email, 
                phoneNumber: user.phoneNumber,
                user_type: user.user_type,
                roles: user.roles.map(role => ({
                    roleId: role._id,
                    roleName: role.name,
                    description: role.description
                }))
            })),
            status: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};
