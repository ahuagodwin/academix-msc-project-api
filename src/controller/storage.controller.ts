import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest, IRole, StorageStatus } from "../types/types";
import { User } from "../models/user.model";
import Storage from "../models/storage.model";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { buildQuery, paginate, paginateResults } from "../helpers/Helpers";
// Ensure role interface is available

export const createStorageSpace = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Extract storage data from request body
    const { name, size, price } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return 
    }

    // Fetch user and populate roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ success: false, message: "User not found" });
      return 
    }

     // Check if the user is a system owner
     if (!isSystemOwner(userId)) {
        await session.abortTransaction();
        res.status(403).json({ error: "Only system owners can create storage space", status: false });
        return;
    }         

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("create_storage"));

    if (!hasPermission) {
      await session.abortTransaction();
      session.endSession();
      res.status(403).json({ success: false, message: "Unauthorized to create storage" });
      return 
    }

   

    if (!name || !size || !price) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ success: false, message: "Name, size and price are required." });
      return 
    }

    // uncomment if only i want to place a restriction of a storage space size from backend
    // if (!validStorageSizes.includes(size)) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   res.status(400).json({ success: false, message: "Invalid storage size." });
    //   return 
    // }


    // Create storage space
    const newStorage = await Storage.create([{ name, size, price, createdBy: userId, status: StorageStatus.active }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: "Storage space created successfully", data: newStorage[0] });
    return 

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating storage:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return 
  } finally {
    session.endSession();
  }
};


// to update storage space
export const updateStorageSpace = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
        const { storageId } = req.params;
        const { name, size, price, status } = req.body;

      const userId = req.user?._id;
  
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized access" });
        return 
      }
  
      // Fetch user and populate roles
      const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
  
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({ success: false, message: "User not found" });
        return 
      }

        // Check if the user is a system owner
     if (!isSystemOwner(userId)) {
        await session.abortTransaction();
        res.status(403).json({ error: "Only system owners can update storage space", status: false });
        return;
    } 
  
      // Check user permissions
      const hasPermission = user.roles.some((role) => role.permissions.includes("update_storage"));
  
      if (!hasPermission) {
        await session.abortTransaction();
        session.endSession();
        res.status(403).json({ success: false, message: "Unauthorized to update storage" });
        return 
      }
  
      // Ensure storage ID is valid
      if (!mongoose.Types.ObjectId.isValid(storageId)) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: "Invalid storage ID" });
        return 
      }
  
      // Find the storage space
      const storage = await Storage.findById(storageId).session(session);
  
      if (!storage) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({ success: false, message: "Storage space not found" });
        return 
      }
  
      if (status && !Object.values(StorageStatus).includes(status)) {
        await session.abortTransaction();
        session.endSession();
       res.status(400).json({ success: false, message: "Invalid storage status" });
       return 
      }
  
      // Update storage fields
      if (name) storage.name = name;
      if (size) storage.size = size;
      if (price) storage.price = price;
      if (status) storage.status = status;
  
      await storage.save({ session });
  
      await session.commitTransaction();
      session.endSession();
  
     res.status(200).json({ success: true, message: "Storage updated successfully", data: storage });
     return 
  
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error updating storage:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
      return 
    } finally {
        session.endSession();
    }};


    // to delete storage space
    export const deleteStorageSpace = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
        const session = await mongoose.startSession();
        session.startTransaction();
      
        try {

          const { storageId } = req.params;
          const userId = req.user?._id;
      
          if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return 
          }
      
          // Fetch user and populate roles
          const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
      
          if (!user) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "User not found" });
            return 
          }

               // Check if the user is a system owner
        if (!isSystemOwner(userId)) {
            await session.abortTransaction();
            res.status(403).json({ error: "Only system owners can delete storage space", status: false });
            return;
        }
      
          // Check user permissions
          const hasPermission = user.roles.some((role) => role.permissions.includes("delete_storage"));
      
          if (!hasPermission) {
            await session.abortTransaction();
            session.endSession();
            res.status(403).json({ success: false, message: "Unauthorized to delete storage" });
            return 
          }
      
          // Ensure storage ID is valid
          if (!mongoose.Types.ObjectId.isValid(storageId)) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ success: false, message: "Invalid storage ID" });
            return 
          }
      
          // Find and delete the storage space
          const storage = await Storage.findByIdAndDelete(storageId).session(session);
      
          if (!storage) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Storage space not found" });
            return 
          }
      
          await session.commitTransaction();
          session.endSession();
      
         res.status(200).json({ success: true, message: "Storage deleted successfully" });
         return 
      
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          console.error("Error deleting storage:", error);
          res.status(500).json({ success: false, message: "Internal Server Error" });
          return 
        } finally {
            session.endSession();
        }
      };


export const getAllStorageSpaces = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
  try {
    // Get userId from request (ensure middleware sets req.user)
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return 
    }

    // Fetch user and populate roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return 
    }

    // Check user permissions
    const hasPermission = user.roles.some((role) => role.permissions.includes("read_storage"));

    if (!hasPermission) {
      res.status(403).json({ success: false, message: "Unauthorized to view storage spaces" });
      return 
    }

       // extracting query parameters
      const { page, limit, ...filters } = req.query;
  
      // applying pagination and filters
      const { pageNumber, limitNumber, skip } = paginate(page, limit);
      const query = buildQuery(filters, ["name", "status"]);

      // Get total count for pagination
    const totalStorageSpaces = await Storage.countDocuments(query);

    // Fetch storage spaces with pagination
    const storageSpaces = await Storage.find(query)
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 })
        .select("-__v")
        .populate("createdBy", "firstName lastName email user_type")
        .populate("users", "_id");

     // Add user count for each storage space
     const storageSpacesWithUserCount = storageSpaces.map(storage => ({
      ...storage.toObject(), 
      userCount: Array.isArray(storage.users) ? storage.users.length : 0
    }));

    res.status(200).json({
      success: true,
      message: "Storage spaces retrieved successfully",
      data: storageSpacesWithUserCount,
     pagination: paginateResults(totalStorageSpaces, pageNumber, limitNumber),
    });
    return 

  } catch (error) {
    console.error("Error fetching storage spaces:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return 
  }
};



export const getStorageAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const hasPermission = user.roles.some(role =>
      role.permissions.includes("view_storage_analytics")
    );

    if (!hasPermission) {
      res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions" });
      return;
    }

    const totalStorage = await Storage.countDocuments();

    const allStorages = await Storage.find({}, "users");
    const userSet = new Set<string>();
    allStorages.forEach(storage => {
      storage.users.forEach((user: any) => userSet.add(user.toString()));
    });
    const totalUsers = userSet.size;

    const totalActive = await Storage.countDocuments({ status: "active" });
    const totalInactive = await Storage.countDocuments({ status: "inactive" });

    // Monthly Chart Data (existing)
    const chartAggregation = await Storage.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const chartData = chartAggregation.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
      value: item.count
    }));

    // Daily trends (last 30 days)
    const dailyTrends = await Storage.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    const formattedDailyTrends = dailyTrends.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}-${item._id.day.toString().padStart(2, "0")}`,
      value: item.count
    }));

    // Weekly trends (last 8 weeks)
    const weeklyTrends = await Storage.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);

    const formattedWeeklyTrends = weeklyTrends.map(item => ({
      week: `W${item._id.week} ${item._id.year}`,
      value: item.count
    }));

    // User activity trends
    const userActivityTrends = await Storage.aggregate([
      {
        $group: {
          _id: "$createdBy",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          fullName: {
            $concat: ["$user.firstName", " ", "$user.lastName"]
          },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: "Storage analytics retrieved successfully",
      data: {
        totalStorage,
        totalUsers,
        totalActive,
        totalInactive,
        chartData,
        dailyTrends: formattedDailyTrends,
        weeklyTrends: formattedWeeklyTrends,
        userActivityTrends
      }
    });

  } catch (error) {
    console.error("Error fetching storage analytics:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};