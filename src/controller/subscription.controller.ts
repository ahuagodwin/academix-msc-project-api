import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest, IRole } from "../types/types";
import Storage from "../models/storage.model";
import Wallet from "../models/wallet.model"; // Import Wallet model
import StoragePurchase from "../models/subscription.model";
import { User } from "../models/user.model";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { formatStorageSize } from "../helpers/Helpers";
import { InflowAmount } from "../models/inflow.model";
import { FinancialSummary } from "../models/financialSummary.model";


export const purchaseStorage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { storageId, totalStorage } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

     // Fetch user and populate roles
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
   
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "User not found" });
            return 
          }     

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("create_subscription"));

    if (!hasPermission) {
      await session.abortTransaction();
      session.endSession();
      res.status(403).json({ success: false, message: "Unauthorized to create storage" });
      return 
    }


    if (!storageId || !totalStorage || totalStorage <= 0) {
      res.status(400).json({ success: false, message: "Invalid storage selection or size." });
      return;
    }

    // Fetch the selected storage details
    const storage = await Storage.findOne({ storageId }).session(session);
    if (!storage) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: "Storage plan not found." });
      return;
    }

    // Calculate total amount
    const amount = storage.price * (totalStorage / storage.size);

    // Fetch the user's wallet
    const wallet = await Wallet.findOne({ userId: userId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      res.status(404).json({ success: false, message: "User wallet not found." });
      return;
    }

    // Check if the user has sufficient funds
    if (wallet.balance < amount) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: "Insufficient wallet balance to purchase storage." });
      return;
    }

    // Deduct balance from wallet
    wallet.balance -= amount;

    // Add transaction history for the wallet
    wallet.transactions.push({
        type: "withdrawal",
        amount,
        description: `Storage purchase for ${formatStorageSize(totalStorage)}`,
        timestamp: new Date(),
        status: "completed",
      });

    await wallet.save({ session });

    const inflowAmount = new InflowAmount({
        userId,
        amount,
        description: `Storage purchase for ${formatStorageSize(totalStorage)}`,
        transactionType: "storage_purchase",
        purchasedBy: `${user?.firstName} ${user?.lastName}`,
      });

      await inflowAmount.save({ session });
      await FinancialSummary.updateSummary();

     // Check if user already purchased this storage plan
     const existingPurchase = await StoragePurchase.findOne({ user: userId, storage: storageId });

     if (existingPurchase) {
       // Update existing purchase
       existingPurchase.totalStorage += storage.size;
       existingPurchase.amount += storage.price;
       await existingPurchase.save();
     } else {
       // Create new purchase record
       const newPurchase = new StoragePurchase({
         user: userId,
         storage: storageId,
         totalStorage: storage.size,
         usedStorage: 0,
         amount: storage.price,
         status: "active",
       });
       await newPurchase.save();
     }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: "Storage purchased successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error purchasing storage:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    session.endSession();
  }
};

export const checkAvailableStorage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }

       // Fetch user and populate roles
       const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
   
       if (!user) {
           await session.abortTransaction();
           session.endSession();
           res.status(404).json({ success: false, message: "User not found" });
           return 
         }     

        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_subscription"));

        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
            return 
        }
  
      const purchases = await StoragePurchase.find({ user: userId });
  
      const totalStorage = purchases.reduce((sum, purchase) => sum + purchase.totalStorage, 0);
      const usedStorage = purchases.reduce((sum, purchase) => sum + purchase.usedStorage, 0);
      const remainingStorage = totalStorage - usedStorage;
  
      res.status(200).json({
        success: true,
        data: {
            totalStorage: formatStorageSize(totalStorage),
            usedStorage: formatStorageSize(usedStorage),
            remainingStorage: formatStorageSize(remainingStorage),
          },
      });
    } catch (error) {
      console.error("Error checking available storage:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  

  export const deleteStoragePurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { purchaseId } = req.params;
      const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
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
            res.status(403).json({ error: "Only system owners can delete purchased storage", status: false });
            return;
        }     

        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_subscription"));

        if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
            return 
        }
  
  
      const deletedPurchase = await StoragePurchase.findByIdAndDelete(purchaseId);
  
      if (!deletedPurchase) {
        res.status(404).json({ success: false, message: "Storage purchase not found" });
        return;
      }
  
      res.status(200).json({ success: true, message: "Storage purchase deleted successfully" });
    } catch (error) {
      console.error("Error deleting storage purchase:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };


  export const getUserStoragePurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }

    // Fetch user and populate roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
    if (!user) {
        res.status(404).json({ error: "User not found", status: false });
        return;
    }    

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("read_subscription"));

    if (!hasPermission) {
        res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
        return 
    }
  
      const purchases = await StoragePurchase.find({ user: userId }).populate("storage");
  
      res.status(200).json({ success: true, data: purchases });
    } catch (error) {
      console.error("Error fetching user storage purchases:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  

  export const getStoragePurchaseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { purchaseId } = req.params;

      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return;
      }

    // Fetch user and populate roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
    if (!user) {
        res.status(404).json({ error: "User not found", status: false });
        return;
    }    

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("read_subscription"));

    if (!hasPermission) {
        res.status(403).json({ success: false, message: "Unauthorized to read subscription" });
        return 
    }
  
      const purchase = await StoragePurchase.findById(purchaseId).populate("storage");
  
      if (!purchase) {
        res.status(404).json({ success: false, message: "Storage purchase not found" });
        return;
      }
  
      res.status(200).json({ success: true, data: purchase });
    } catch (error) {
      console.error("Error fetching storage purchase:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  
  
