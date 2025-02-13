import { Management } from "./../models/management.model";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../models/user.Model";
import { Role } from "../models/roles.model";
import { generateRandomPassword } from "../utils/utils";
import { StorageSpace } from "../models/storage_space.model";
import Wallet from "../models/wallet.model";

enum UserRole {
  LECTURER = "teacher", // teachers
  STUDENT = "student", // students
  SUPER_ADMIN = "super admin", // for dean, vc, and faculty officer
  ADMIN = "admin", // for staff of the faculty, dean and vc
  HOD = "head of department", //head of a department
  HOD_ADMIN = "administrator", // for staff of the faculty
}

enum UserFileStorageSpace {
  BASIC_GB_4 = "4 GB",
  STANDARD_GB_10 = "10 GB",
  PREMIUM_GB_20 = "20 GB",
}

enum UserFileStorageSpaceName {
  BASIC = "Basic",
  STANDARD = "Standard",
  PREMIUM = "Premium",
}

// Controller to add a new user with role and permissions
export const addManagementUser = async (
  req: Request,
  res: Response
): Promise<void> => {
    
  let newUser: any = null;
  let allocatedSize = 2; // 2 GB allocated
  let originalStorageSize: string | null = null;

  try {
    // Validate request input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, firstName, lastName, mobile, roleName, permissions } =
      req.body;
    const currentUser = req.user;

    // Ensure the current user is associated with a school
    if (!currentUser.schoolName) {
      res.status(400).json({
        success: false,
        message: "You must be associated with a school to add a user.",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await Management.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
        const conflictMessage =
          existingUser.email === email && existingUser.mobile === mobile
            ? "User already exists with this email, phone number and school"
            : existingUser.email === email
            ? "User already exists with this email."
            : "User already exists with this phone number.";

        res.status(409).json({ error: conflictMessage, status: false });
        return;
      }

    // Hash password
    const generatedPassword = generateRandomPassword(8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Create new user
    newUser = new Management({
      firstName,
      lastName,
      email,
      mobile,
      password: hashedPassword,
      schoolName: currentUser.schoolName,
    });
    await newUser.save();

    // Create, Assign role and permissions
    let role = await Role.findOne({ name: roleName });
    if (!role) {
      role = new Role({ name: roleName, user: newUser.adminId, permissions });
      await role.save();
    }

    newUser.role = role.roleId;
    await newUser.save();

    // Check if the user already has a wallet
    const existingWallet = await Wallet.findOne({ userId: newUser.adminId});

    if (!existingWallet) {
      const wallet = new Wallet({
        userId: newUser.adminId,
        userType: "Management",
        balance: 0,
        currency: "NGN"
      });
      await wallet.save();

      // Update User with Wallet ID
      await Management.findOneAndUpdate(
        { adminId: newUser._id },
        { wallet: wallet.walletId }
      );
    }

    // Check if the current user already has a storage space
    const existingStorageSpace = await StorageSpace.findOne({
        storageSpaceId: currentUser.storage_space,
      });
  
      if (existingStorageSpace) {
        originalStorageSize = existingStorageSpace.size; // Store original size
  
        const currentSize = parseInt(originalStorageSize); // Extract numerical value
        if (currentSize >= allocatedSize) {
          existingStorageSpace.size = `${currentSize - allocatedSize} GB`;
          await existingStorageSpace.save();
  
          const newUserStorage = new StorageSpace({
            user: newUser.adminId,
            size: `${allocatedSize} GB`,
            name: UserFileStorageSpaceName.BASIC,
          });
  
          await newUserStorage.save();
          await Management.findOneAndUpdate(
            { adminId: newUser.adminId },
            { storage_space: newUserStorage.storageSpaceId }
          );
        } else {
          res.status(400).json({
            success: false,
            message: "Insufficient storage space to allocate 2 GB.",
          });
          return;
        }
      } else {
        const space = new StorageSpace({
          user: newUser.adminId,
          size: UserFileStorageSpace.STANDARD_GB_10,
          name: UserFileStorageSpaceName.STANDARD,
        });
  
        await space.save();
        await Management.findOneAndUpdate(
          { adminId: newUser.adminId },
          { storage_space: space.storageSpaceId }
        );
      }

    res.status(201).json({
      success: true,
      message: "User Management added successfully",
      user: newUser,
      generatedPassword,
    });
    return;
  } catch (error) {
    console.error("Error adding user:", error);

    if (newUser) {
      console.log(`Deleting user ${newUser.email} due to an error.`);
      await Management.findByIdAndDelete(newUser.adminId);
    }

    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
    return;
  }
};


// all management operations
  export const getAllManagements = async (req: Request, res: Response): Promise<void> => {
    try {

      const user = req.user;
      const { schoolName } = req.params
  
      // Ensure user is associated with a school
      if (!user.schoolName) {
        res.status(400).json({
          success: false,
          message: "You must be associated with a school to view managements.",
        });
        return;
      }
 
     if (!schoolName) {
       console.log("Invalid schoolName parameter.");
       res.status(400).json({
         success: false,
         message: "Invalid school name provided.",
       });
       return;
     }
 
     // Ensure the requested school matches the user's school
     if (user.schoolName !== schoolName) {
       console.log("Authorization failed: User is not allowed to access this school.");
       res.status(403).json({
         success: false,
         message: "You are not authorized to view managements for this school.",
       });
       return;
     }

      // Retrieve all departments within the user's school
      const managements = await Management.find({ schoolName: user.schoolName });
  
      res.status(200).json({
        success: true,
        message: "managements retrieved successfully.",
        managements,
      });
      return;
    } catch (error) {
      console.error("Error retrieving managements:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
      return;
    }
  };