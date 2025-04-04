
import { User } from "../models/user.model";
import Group from "../models/group.model";
import { AuthenticatedRequest, IRole } from "../types/types";
import { Response } from "express";
import mongoose from "mongoose";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { sendNotification } from "../email/notification";
import GroupRequest from "../models/groupRequest.model";

// Create a Group**
export const createGroup = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name, members } = req.body;
      const ownerId = req.user?._id;
  
      if (!name || !Array.isArray(members) || members.length === 0) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: "Group name and at least one member are required" });
        return 
      }
  
      // Ensure members exist
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: "Some members do not exist" });
        return 
      }

       // Fetch owner details
       const owner = await User.findById(ownerId).select("firstName");
       if (!owner) {
           await session.abortTransaction();
           session.endSession();
           res.status(403).json({ success: false, message: "Owner not found" });
           return;
       }  
  
      // Ensure owner is included only once
      const uniqueMembers = [...new Set([ownerId, ...members])];
  
      // Create new group
      const newGroup = new Group({
        name,
        owner: ownerId,
        members: uniqueMembers,
        files: [],
      });
  
      await newGroup.save({ session });

      await session.commitTransaction();
      session.endSession();

      for (const userId of uniqueMembers) {
        await sendNotification({
            userId,
            subject: `Group Creation`,
            message: `'${name}' Group have been created  by ${owner.firstName}`,
            type: "group"
        });
    }
  
      res.status(201).json({ success: true, message: "Group created successfully", data: newGroup });
    } catch (error) {
      console.error("Error creating group:", error);
      await session.abortTransaction();
      res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        session.endSession();
    }
  };
  

  export const updateGroup = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { groupId } = req.params;
      const { name, addMembers, removeMembers } = req.body;
      const ownerId = req.user?._id;
  
      // Find the group
      const group = await Group.findById(groupId);
      if (!group) {
        await session.abortTransaction();
        res.status(404).json({ success: false, message: "Group not found" });
        return 
      }
  
      // Ensure only the owner can update the group
      if (String(group.owner) !== String(ownerId)) {
        await session.abortTransaction();
        res.status(403).json({ success: false, message: "You do not have permission to update this group." });
        return 
      }
  
      // Update group name if provided
      if (name) group.name = name;
  
      // Add new members
      if (addMembers && Array.isArray(addMembers) && addMembers.length > 0) {
        const validUsers = await User.find({ _id: { $in: addMembers } }).session(session);
        if (validUsers.length !== addMembers.length) {
            await session.abortTransaction();
          res.status(400).json({ success: false, message: "Some members do not exist" });
          return 
        }
        group.members = [...new Set([...group.members, ...addMembers])];
      }
  
      // Remove members
      if (removeMembers && Array.isArray(removeMembers) && removeMembers.length > 0) {
        group.members = group.members.filter((member) => !removeMembers.includes(String(member)));
      }
  
      await group.save({ session });
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({ success: true, message: "Group updated successfully", data: group });
    } catch (error) {
      console.error("Error updating group:", error);
      await session.abortTransaction();
      res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        session.endSession();
    }
  };
  

// Add a User to a Group**
export const addUsersToGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
        const { groupId } = req.params;
      const { userIds } = req.body;
      const ownerId = req.user?._id;
  
      if (!Array.isArray(userIds) || userIds.length === 0) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: "userIds must be a non-empty array" });
        return
      }
  
      const group = await Group.findById(groupId).session(session);
      if (!group) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({ success: false, message: "Group not found" });
        return 
      }

         // Fetch owner details
         const owner = await User.findById(ownerId).select("firstName");
         if (!owner) {
             await session.abortTransaction();
             session.endSession();
             res.status(403).json({ success: false, message: "Owner not found" });
             return;
         }
  
      // Ensure only the group owner can add members
      if (String(group.owner) !== String(ownerId)) {
        await session.abortTransaction();
        session.endSession();
        res.status(403).json({ success: false, message: "You do not have permission to add members to this group." });
        return 
      }
  
      // Remove duplicates and already existing members
      const uniqueUserIds = userIds.filter((id) => !group.members.includes(id));
  
      if (uniqueUserIds.length === 0) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: "All provided users are already in the group." });
        return 
      }
  
      // Add users to the group
      group.members.push(...uniqueUserIds);
      await group.save({ session });
  
      await session.commitTransaction();
      session.endSession();

      for (const userId of uniqueUserIds) {
        await sendNotification({
            userId,
            subject: `Welcome to ${group.name} Group`,
            message: `You have been added to the group '${group.name}' by ${owner.firstName}`,
            type: "group"
        });
    }
  
      res.status(200).json({ success: true, message: "Users added to group successfully", data: group });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error adding users to group:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };


  export const deleteGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { groupId } = req.params;
      const ownerId = req.user?._id;
  
      const group = await Group.findById(groupId).session(session);
      if (!group) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({ success: false, message: "Group not found" });
        return 
      }
  
      // Ensure only the group owner can delete the group
      if (String(group.owner) !== String(ownerId)) {
        await session.abortTransaction();
        session.endSession();
        res.status(403).json({ success: false, message: "You do not have permission to delete this group." });
        return 
      }
  
      // Ensure no users remain in the group except the owner
      if (group.members.length > 1) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          success: false,
          message: "Cannot delete group. Remove all members before deleting."
        });
        return 
      }
  
      // Delete the group
      await Group.findByIdAndDelete(groupId).session(session);
  
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error deleting group:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };


// Get User's Groups**
export const getUserGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
     res.status(401).json({ success: false, message: "Unauthorized" });
     return 
    }

    // Fetch groups where the user is a member or owner
    const groups = await Group.find({ members: userId })
      .populate("owner", "name email") // Fetch owner details
      .populate("members", "name email") // Fetch member details
      .lean();

    res.status(200).json({
      success: true,
      message: "User groups retrieved successfully",
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const getAllGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession(); // Start session
  session.startTransaction();

  try {
    const userId = req.user?._id;

    // Ensure user is authenticated
    if (!userId) {
      await session.abortTransaction();
      res.status(401).json({ success: false, message: "Unauthorized: No user found" });
      return;
    }

    // Fetch user and populate roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
    if (!user) {
      await session.abortTransaction();
      res.status(404).json({ error: "User not found", status: false });
      return;
    }

    // Check if the user is a system owner
    if (!isSystemOwner(userId)) {
      await session.abortTransaction();
      res.status(403).json({ error: "Only system owners can read all groups", status: false });
      return;
    }

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("read_groups"));
    if (!hasPermission) {
      await session.abortTransaction();
      res.status(403).json({ error: "You're not permitted to read all groups", status: false });
      return;
    }

    // Fetch all groups and populate owner & members details
    const groups = await Group.find()
      .populate("owner", "name email") // Fetch owner details
      .populate("members", "name email") // Fetch member details
      .lean();

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "All groups retrieved successfully",
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching all groups:", error);
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    session.endSession(); // Ensure session ends
  }
};


export const requestAccessToGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { groupId } = req.params;
        const userId = req.user?._id;

        // Ensure user is authenticated
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: No user found" });
            return;
        }

        // Find the group
        const group = await Group.findById(groupId).populate("owner", "firstName email");
        if (!group) {
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }

        // Check if user is already a member
        if (group.members.includes(userId)) {
            res.status(400).json({ success: false, message: "You are already a member of this group" });
            return;
        }

        // Check if the request already exists
        const existingRequest = await GroupRequest.findOne({ group: groupId, user: userId });
        if (existingRequest) {
            res.status(400).json({ success: false, message: "You have already requested access to this group" });
            return;
        }

        // Create a new request
        const newRequest = new GroupRequest({ user: userId, group: groupId, status: "pending" });
        await newRequest.save();

        // Notify the group owner about the access request
        await sendNotification({
            userId: group.owner._id,
            subject: "New Group Access Request",
            message: `User has requested access to join the group '${group.name}'.`,
            type: "access"
        });

        res.status(200).json({ success: true, message: "Access request sent successfully" });
    } catch (error) {
        console.error("Error requesting access to group:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
  