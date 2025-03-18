import { Types } from "mongoose";
import { User } from "../models/user.model";
import { IRole } from "../types/types";


/**
 * @desc Middleware to check if user is a System Owner
 */
export const isSystemOwner = async (userId: string | Types.ObjectId): Promise<boolean> => {
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
    if (!user) return false;

    return user.roles.some((role) => role?.name === "System Owner");
};