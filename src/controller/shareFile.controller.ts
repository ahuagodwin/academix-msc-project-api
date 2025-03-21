import File from "../models/file.model";
import { AuthenticatedRequest, UserPermission } from "../types/types";
import { Response } from "express";
import FileShare from "../models/fileShare.model";
import { User } from "../models/user.model";
import Group from "../models/group.model";
import { sendNotification } from "../email/notification";


// Share File to User or Group**
export const shareFile = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
  try {
    const { fileId, recipients, groupId, permissions } = req.body;
    const senderId = req.user?._id;

    if (!fileId || (!recipients && !groupId)) {
      res.status(400).json({ message: "File ID and either recipients or group ID are required." });
      return 
    }

    const file = await File.findById(fileId);
    if (!file) {
      res.status(404).json({ success: false, message: "File not found" });
      return 
    }

     // Ensure sender is the file owner or has permission
     if (String(file.userId) !== String(senderId)) {
        res.status(403).json({ success: false, message: "You do not have permission to share this file." });
        return 
      }

        //  Check recipients (if provided)
    let validRecipients: string[] = [];
    if (recipients?.length) {
      const users = await User.find({ _id: { $in: recipients } }, "_id");
      validRecipients = users.map(user => String(user._id));

      if (validRecipients.length !== recipients.length) {
        res.status(400).json({ success: false, message: "Some recipients do not exist." });
        return 
      }
    }

    // Check group (if provided)
    let validGroupId: string | null = null;
    if (groupId) {
      const groupExists = await Group.findById(groupId);
      if (!groupExists) {
         res.status(404).json({ success: false, message: "Group not found." });
         return
      }
      validGroupId = groupId;
    }

    const newShare = new FileShare({
        sender: senderId,
        recipients: validRecipients,
        file: fileId,
        groupId: validGroupId,
        permissions: permissions || [],
      });
  
      await newShare.save();

       // Send notifications to recipients
    if (validRecipients.length > 0) {
        validRecipients.forEach(async (recipientId) => {
          await sendNotification({
            userId: recipientId,
            subject: "New File Shared",
            message: `You have received a new file shared with you: <br><b>${file.name}</b>`,
            type: "share",
          });
        });
      }

    res.status(201).json({ success: true, message: "File shared successfully", data: newShare });
  } catch (error) {
    console.error("Error sharing file:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateShareFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { shareId } = req.params;
        const { recipients, groupId, permissions } = req.body;
        const senderId = req.user?._id;

        // Find the shared file entry
        const sharedFile = await FileShare.findById(shareId);
        if (!sharedFile) {
            res.status(404).json({ success: false, message: "Shared file not found" });
            return;
        }

        // Ensure sender is the file owner
        if (String(sharedFile.sender) !== String(senderId)) {
            res.status(403).json({ success: false, message: "You do not have permission to update this file." });
            return;
        }

        // Update the fields if provided in the request
        if (recipients) {
            if (!Array.isArray(recipients)) {
                res.status(400).json({ success: false, message: "Recipients must be an array of user IDs." });
                return;
            }
            sharedFile.recipients = recipients;
        }

        if (groupId !== undefined) sharedFile.groupId = groupId;

        if (permissions) {
            if (!Array.isArray(permissions) || !permissions.every(p => [UserPermission.READ, UserPermission.UPDATE, UserPermission.DOWNLOAD].includes(p))) {
                res.status(400).json({ success: false, message: "Invalid permissions format. Must be an array containing 'read', 'update', or 'download'." });
                return;
            }
            sharedFile.permissions = permissions;
        }

        // Save the updated shared file entry
        await sharedFile.save();

        res.status(200).json({ success: true, message: "Shared file updated successfully", data: sharedFile });
    } catch (error) {
        console.error("Error updating shared file:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteShareFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { shareId } = req.params;
        const senderId = req.user?._id;

        // Find the shared file entry
        const sharedFile = await FileShare.findById(shareId);
        if (!sharedFile) {
            res.status(404).json({ success: false, message: "Shared file not found" });
            return;
        }

        // Ensure sender is the file owner
        if (String(sharedFile.sender) !== String(senderId)) {
            res.status(403).json({ success: false, message: "You do not have permission to delete this shared file." });
            return;
        }

        // Delete the shared file entry
        await FileShare.findByIdAndDelete(shareId);

        res.status(200).json({ success: true, message: "Shared file deleted successfully" });
    } catch (error) {
        console.error("Error deleting shared file:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Get Files Shared with a User**
export const getSharedFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        // Find all shared files where the user is a recipient or part of a group
        const sharedFiles = await FileShare.find({
            $or: [{ recipients: userId }, { groupId: { $ne: null } }]
        })
        .populate("file") // Populate file details
        .populate("sender", "firstName lastName") // Populate sender's name...
        .populate("recipients", "firstName lastName") // Populate recipients' names...
        .populate("groupId", "name"); // Populate group details

        res.status(200).json({ success: true, message: "Shared files retrieved successfully", data: sharedFiles });
    } catch (error) {
        console.error("Error retrieving shared files:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Get Files Shared with a Group**
export const getSharedFilesByGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { groupId } = req.params;
        const userId = req.user?._id;

        if (!groupId) {
            res.status(400).json({ success: false, message: "Group ID is required" });
            return;
        }

        if(!userId) {
            res.status(401).json({ success: false, message: "User not found" });
            return;
        }

        // Verify that the user belongs to the group
        const group = await Group.findById(groupId);
        if (!group) {
            res.status(404).json({ success: false, message: "Group not found" });
            return;
        }

        if (!group.members.includes(userId)) {
            res.status(403).json({ success: false, message: "You are not a member of this group" });
            return;
        }

        // Fetch files shared with this group
        const sharedFiles = await FileShare.find({ groupId })
            .populate("file") // Populate file details
            .populate("sender", "firstName lastName") // Populate sender details
            .populate("recipients", "firstName lastName") // Populate recipient details
            .populate("groupId", "name"); // Populate group details

        res.status(200).json({ success: true, message: "Files shared with the group retrieved successfully", data: sharedFiles });
    } catch (error) {
        console.error("Error retrieving shared files for group:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


/**
 * Controller for requesting permissions on a shared file
 */
export const requestFilePermissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileId, requestedPermissions } = req.body;
    const recipientId = req.user?._id;

    if (!fileId || !requestedPermissions?.length) {
      res.status(400).json({ success: false, message: "File ID and requested permissions are required." });
      return;
    }

    // Check if the file exists
    const file = await File.findById(fileId);
    if (!file) {
      res.status(404).json({ success: false, message: "File not found" });
      return;
    }

    // Check if the file has been shared with the recipient
    const fileShare = await FileShare.findOne({ file: fileId, recipients: recipientId });
    if (!fileShare) {
      res.status(403).json({ success: false, message: "You do not have access to this file." });
      return;
    }

    // Check if the recipient already has the requested permissions
    const existingPermissions = fileShare.permissions || [];
    const newPermissions = requestedPermissions.filter(
      (perm: string) => !existingPermissions.includes(perm)
    );

    if (newPermissions.length === 0) {
      res.status(400).json({ success: false, message: "You already have these permissions." });
      return;
    }

    // Send notification to the file owner
    const owner = await User.findById(file.userId);
    if (owner) {
      await sendNotification({
        userId: owner._id,
        subject: "Permission Request",
        message: `User ${req.user?.firstName} ${req.user?.lastName} has requested the following permissions for your file: ${newPermissions.join(", ")}.`,
        type: "permission",
      });
    }

    res.status(200).json({ success: true, message: "Permission request sent successfully." });
  } catch (error) {
    console.error("Error requesting file permissions:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

