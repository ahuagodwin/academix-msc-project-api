

import { User } from "../models/user.model";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";


/**
 * @desc    Get User by ID and School ID
 * @access  Private
 */
export const getUser = asyncHandler(async (req: Request, res: Response):Promise<void> => {
    const { userId, schoolId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(schoolId)) {
        res.status(400).json({ error: "Invalid User ID or School ID" });
        return 
    }

    const user = await User.findOne({ _id: userId, school: schoolId }).populate("school").populate("role")

    if (!user) {
        res.status(404).json({ error: "User not found in this school" });
        return
    }

    res.status(200).json({ success: true, message: "user data retrieved successfully",  data: user });
});

/**
 * @desc    Update User by ID and School ID
 * @access  Private
 */
export const updateUser = asyncHandler(async (req: Request, res: Response):Promise<void> => {
    const { schoolId, userId } = req.params;
    const { firstName, lastName, email, phoneNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(schoolId)) {
        res.status(400).json({ error: "Invalid User ID or School ID" });
        return 
    }

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, school: schoolId },
        { firstName, lastName, email, phoneNumber },
        { new: true, runValidators: true }
    ).populate("school", "name");

    if (!updatedUser) {
        res.status(404).json({ error: "User not found in this school" });
        return 
    }

    res.status(200).json({ success: true, data: updatedUser });
});

/**
 * @desc    Delete User by ID and School ID
 * @access  Private
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response):Promise<void> => {
    const { schoolId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(schoolId)) {
        res.status(400).json({ error: "Invalid User ID or School ID" });
        return 
    }

    const deletedUser = await User.findOneAndDelete({ _id: userId, school: schoolId });

    if (!deletedUser) {
        res.status(404).json({ error: "User not found in this school" });
        return 
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
});
