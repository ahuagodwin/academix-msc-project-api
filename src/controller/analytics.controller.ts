import { AuthenticatedRequest, IRole } from "../types/types";
import { Response } from "express";
import { isSystemOwner } from "../middlewares/isSystemOwner";
import { User } from "../models/user.model";
import Wallet from "../models/wallet.model";
import { Transaction } from "../models/transactions.model";
import Storage from "../models/storage.model";
import School from "../models/school.model";
import File from "../models/file.model";
import FileShare from "../models/fileShare.model";
import { FinancialSummary } from "../models/financialSummary.model";
import { InflowAmount } from "../models/inflow.model";
import { OutflowAmount } from "../models/outflow.model";
import Group from "../models/group.model";
import GroupRequest from "../models/groupRequest.model";
import { Notification } from "../models/notification.model";
import Role from "../models/role.model";
import StoragePurchase from "../models/subscription.model";

export const getGeneralAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    // Find user and check roles
    const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
    if (!user) {
      res.status(404).json({ error: "User not found", status: false });
      return;
    }

    // Check if user is a system owner or has view_general_analytics permission
    const isOwner = isSystemOwner(userId);
    const hasPermission = user.roles.some((role) => role.permissions.includes("view_general_analytics"));

    if (!isOwner && !hasPermission) {
      res.status(403).json({ error: "You're not permitted to view analytics", status: false });
      return;
    }

    // Get time range from query params or default to last 30 days
    const { startDate, endDate } = req.query;
    const endDateTime = endDate ? new Date(endDate as string) : new Date();
    const startDateTime = startDate 
      ? new Date(startDate as string) 
      : new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    // Prepare date range filter
    const dateFilter = {
      createdAt: {
        $gte: startDateTime,
        $lte: endDateTime
      }
    };

    // ===== Role Analytics =====
    const totalRoles = await Role.countDocuments();
    
    // Get roles with most permissions
    const rolesWithPermissions = await Role.aggregate([
      { $project: { name: 1, permissionCount: { $size: "$permissions" } } },
      { $sort: { permissionCount: -1 } },
      { $limit: 5 }
    ]);
    
    // ===== User Analytics =====
    const totalUsers = await User.countDocuments();
    
    // User type distribution
    const userTypeDistribution = await User.aggregate([
      { $group: { _id: "$user_type", count: { $sum: 1 } } },
      { $project: { _id: 0, type: "$_id", count: 1 } }
    ]);
    
    // New users in the date range
    const newUsers = await User.countDocuments({
      ...dateFilter
    });
    
    // Verified vs unverified users
    const verifiedUsers = await User.countDocuments({ verified: true });
    const unverifiedUsers = await User.countDocuments({ verified: false });
    
    // Blocked users
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    
    // Users by school
    const usersBySchool = await User.aggregate([
      { $match: { school: { $exists: true } } },
      { $group: { _id: "$school", count: { $sum: 1 } } },
      { $lookup: { from: "schools", localField: "_id", foreignField: "_id", as: "schoolInfo" } },
      { $unwind: { path: "$schoolInfo", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, school: "$schoolInfo.name", count: 1 } }
    ]);

    // ===== Financial Analytics =====
    // Get overall financial summary
    await FinancialSummary.updateSummary();

    const financialSummary = await FinancialSummary.findOne() || {
      totalInflowAmount: 0,
      totalOutflowAmount: 0,
      netBalance: 0
    };
    
    // Recent inflows in date range
    const recentInflows = await InflowAmount.countDocuments({
      timestamp: { $gte: startDateTime, $lte: endDateTime }
    });
    
    const totalRecentInflowAmount = await InflowAmount.aggregate([
      { $match: { timestamp: { $gte: startDateTime, $lte: endDateTime } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Inflow by transaction type
    const inflowByType = await InflowAmount.aggregate([
      { $group: { _id: "$transactionType", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
      { $project: { _id: 0, type: "$_id", count: 1, totalAmount: 1 } }
    ]);
    
    // Recent outflows in date range
    const recentOutflows = await OutflowAmount.countDocuments({
      timestamp: { $gte: startDateTime, $lte: endDateTime }
    });
    
    const totalRecentOutflowAmount = await OutflowAmount.aggregate([
      { $match: { timestamp: { $gte: startDateTime, $lte: endDateTime } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    // Outflow status distribution
    const outflowStatusDistribution = await OutflowAmount.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
      { $project: { _id: 0, status: "$_id", count: 1, totalAmount: 1 } }
    ]);

    // Transaction analytics
    const totalTransactions = await Transaction.countDocuments();
    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: startDateTime, $lte: endDateTime }
    });
    
    // Transaction status distribution
    const transactionStatusDistribution = await Transaction.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);
    
    // Transaction amount by status
    const transactionAmountByStatus = await Transaction.aggregate([
      { $group: { _id: "$status", totalAmount: { $sum: "$amount" } } },
      { $project: { _id: 0, status: "$_id", totalAmount: 1 } }
    ]);
    
    // Transaction by payment gateway
    const transactionByGateway = await Transaction.aggregate([
      { $group: { _id: "$paymentGateway", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
      { $project: { _id: 0, gateway: "$_id", count: 1, totalAmount: 1 } }
    ]);

    // ===== Wallet Analytics =====
    const totalWallets = await Wallet.countDocuments();
    
    // Total wallet balance
    const walletBalance = await Wallet.aggregate([
      { $group: { _id: null, totalBalance: { $sum: "$balance" } } }
    ]);
    
    // Average wallet balance
    const averageWalletBalance = await Wallet.aggregate([
      { $group: { _id: null, average: { $avg: "$balance" } } }
    ]);
    
    // Count of empty wallets
    const emptyWallets = await Wallet.countDocuments({ balance: 0 });
    
    // Recent wallet transactions
    const recentWalletTransactions = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $match: { "transactions.timestamp": { $gte: startDateTime, $lte: endDateTime } } },
      { $count: "total" }
    ]);
    
    // Wallet transaction type distribution
    const walletTransactionTypes = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $group: { _id: "$transactions.type", count: { $sum: 1 } } },
      { $project: { _id: 0, type: "$_id", count: 1 } }
    ]);
    
    // Wallet transaction status distribution
    const walletTransactionStatus = await Wallet.aggregate([
      { $unwind: "$transactions" },
      { $group: { _id: "$transactions.status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);

    // ===== Storage Analytics =====
    const totalStoragePlans = await Storage.countDocuments();
    const activeStoragePlans = await Storage.countDocuments({ status: "active" });
    
    // Storage plans by size
    const storagePlansBySize = await Storage.aggregate([
      { $group: { _id: "$size", count: { $sum: 1 }, averagePrice: { $avg: "$price" } } },
      { $project: { _id: 0, size: "$_id", count: 1, averagePrice: 1 } },
      { $sort: { size: 1 } }
    ]);
    
    const totalStoragePurchases = await StoragePurchase.countDocuments();
    
    // Recent storage purchases
    const recentStoragePurchases = await StoragePurchase.countDocuments({
      purchasedAt: { $gte: startDateTime, $lte: endDateTime }
    });
    
    // Total storage purchased
    const totalStoragePurchased = await StoragePurchase.aggregate([
      { $group: { _id: null, totalStorage: { $sum: "$totalStorage" } } }
    ]);
    
    // Total storage used
    const totalStorageUsed = await StoragePurchase.aggregate([
      { $group: { _id: null, usedStorage: { $sum: "$usedStorage" } } }
    ]);
    
    // Storage utilization percentage
    const storageUtilization = totalStoragePurchased.length > 0 && totalStorageUsed.length > 0 
      ? (totalStorageUsed[0].usedStorage / totalStoragePurchased[0].totalStorage) * 100 
      : 0;
    
    // Storage status distribution
    const storageStatusDistribution = await StoragePurchase.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);
    
    // Users with most storage
    const topStorageUsers = await StoragePurchase.aggregate([
      { $group: { _id: "$user", totalStorage: { $sum: "$totalStorage" } } },
      { $sort: { totalStorage: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, user: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] }, totalStorage: 1 } }
    ]);

    // ===== File Analytics =====
    const totalFiles = await File.countDocuments();
    
    // Files uploaded in date range
    const newFiles = await File.countDocuments({
      ...dateFilter
    });
    
    // Total file size
    const totalFileSize = await File.aggregate([
      { $group: { _id: null, totalSize: { $sum: "$size" } } }
    ]);
    
    // File type distribution
    const fileTypeDistribution = await File.aggregate([
      { $group: { _id: "$fileType", count: { $sum: 1 } } },
      { $project: { _id: 0, type: "$_id", count: 1 } }
    ]);
    
    // File status distribution
    const fileStatusDistribution = await File.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);
    
    // File access distribution
    const fileAccessDistribution = await File.aggregate([
      { $group: { _id: "$access", count: { $sum: 1 } } },
      { $project: { _id: 0, access: "$_id", count: 1 } }
    ]);
    
    // Users with most files
    const usersWithMostFiles = await File.aggregate([
      { $group: { _id: "$userId", fileCount: { $sum: 1 }, totalSize: { $sum: "$size" } } },
      { $sort: { fileCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, user: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] }, fileCount: 1, totalSize: 1 } }
    ]);
    
    // Most popular file tags
    const popularFileTags = await File.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, tag: "$_id", count: 1 } }
    ]);

    // ===== File Sharing Analytics =====
    const totalFileShares = await FileShare.countDocuments();
    
    // Recent file shares
    const recentFileShares = await FileShare.countDocuments({
      ...dateFilter
    });
    
    // Permission distribution in file shares
    const fileSharePermissions = await FileShare.aggregate([
      { $unwind: "$permissions" },
      { $group: { _id: "$permissions", count: { $sum: 1 } } },
      { $project: { _id: 0, permission: "$_id", count: 1 } }
    ]);
    
    // Most active sharers
    const activeSharers = await FileShare.aggregate([
      { $group: { _id: "$sender", shareCount: { $sum: 1 } } },
      { $sort: { shareCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, user: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] }, shareCount: 1 } }
    ]);
    
    // Group sharing activity
    const groupSharingActivity = await FileShare.aggregate([
      { $match: { groupId: { $ne: null } } },
      { $unwind: "$groupId" },
      { $group: { _id: "$groupId", shareCount: { $sum: 1 } } },
      { $lookup: { from: "groups", localField: "_id", foreignField: "_id", as: "groupInfo" } },
      { $unwind: "$groupInfo" },
      { $project: { _id: 0, group: "$groupInfo.name", shareCount: 1 } },
      { $sort: { shareCount: -1 } },
      { $limit: 5 }
    ]);

    // ===== School Analytics =====
    const totalSchools = await School.countDocuments();
    
    // Count faculties
    const facultyCount = await School.aggregate([
      { $unwind: "$faculties" },
      { $count: "total" }
    ]);
    
    // Count departments
    const departmentCount = await School.aggregate([
      { $unwind: "$faculties" },
      { $unwind: "$faculties.departments" },
      { $count: "total" }
    ]);
    
    // Count courses
    const courseCount = await School.aggregate([
      { $unwind: "$faculties" },
      { $unwind: "$faculties.departments" },
      { $unwind: "$faculties.departments.courses" },
      { $count: "total" }
    ]);
    
    // Schools with most faculties
    const schoolsWithMostFaculties = await School.aggregate([
      { $project: { name: 1, facultyCount: { $size: "$faculties" } } },
      { $sort: { facultyCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Faculties with most departments
    const facultiesWithMostDepartments = await School.aggregate([
      { $unwind: "$faculties" },
      { $project: { schoolName: "$name", facultyName: "$faculties.name", departmentCount: { $size: "$faculties.departments" } } },
      { $sort: { departmentCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Departments with most courses
    const departmentsWithMostCourses = await School.aggregate([
      { $unwind: "$faculties" },
      { $unwind: "$faculties.departments" },
      { $project: { 
        schoolName: "$name", 
        facultyName: "$faculties.name", 
        departmentName: "$faculties.departments.name", 
        courseCount: { $size: "$faculties.departments.courses" } 
      } },
      { $sort: { courseCount: -1 } },
      { $limit: 5 }
    ]);

    // ===== Group Analytics =====
    const totalGroups = await Group.countDocuments();
    
    // New groups in date range
    const newGroups = await Group.countDocuments({
      ...dateFilter
    });
    
    // Average group size
    const averageGroupSize = await Group.aggregate([
      { $project: { memberCount: { $size: "$members" } } },
      { $group: { _id: null, average: { $avg: "$memberCount" } } }
    ]);
    
    // Largest groups
    const largestGroups = await Group.aggregate([
      { $project: { name: 1, memberCount: { $size: "$members" } } },
      { $sort: { memberCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Groups with most files
    const groupsWithMostFiles = await Group.aggregate([
      { $project: { name: 1, fileCount: { $size: "$files" } } },
      { $sort: { fileCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Most active group owners
    const activeGroupOwners = await Group.aggregate([
      { $group: { _id: "$owner", groupCount: { $sum: 1 } } },
      { $sort: { groupCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, user: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] }, groupCount: 1 } }
    ]);

    // ===== Group Request Analytics =====
    const totalGroupRequests = await GroupRequest.countDocuments();
    
    // Group request status distribution
    const groupRequestStatusDistribution = await GroupRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);
    
    // Recent group requests
    const recentGroupRequests = await GroupRequest.countDocuments({
      ...dateFilter
    });
    
    // Groups with most pending requests
    const groupsWithMostRequests = await GroupRequest.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: "$group", requestCount: { $sum: 1 } } },
      { $sort: { requestCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "groups", localField: "_id", foreignField: "_id", as: "groupInfo" } },
      { $unwind: "$groupInfo" },
      { $project: { _id: 0, group: "$groupInfo.name", requestCount: 1 } }
    ]);

    // ===== Activity Analytics =====
    const totalNotifications = await Notification.countDocuments();
    
    // Recent notifications
    const recentNotifications = await Notification.countDocuments({
      createdAt: { $gte: startDateTime, $lte: endDateTime }
    });
    
    // Unread notifications percentage
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    const unreadNotificationsPercentage = totalNotifications > 0 ? 
      (unreadNotifications / totalNotifications) * 100 : 0;
    
    // Users with most notifications
    const usersWithMostNotifications = await Notification.aggregate([
      { $group: { _id: "$user", notificationCount: { $sum: 1 } } },
      { $sort: { notificationCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, user: { $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"] }, notificationCount: 1 } }
    ]);

    // Compile all analytics into one response
    const analytics = {
      roles: {
        total: totalRoles,
        topRolesByPermissions: rolesWithPermissions
      },
      users: {
        total: totalUsers,
        new: newUsers,
        byType: userTypeDistribution,
        verification: {
          verified: verifiedUsers,
          unverified: unverifiedUsers
        },
        blocked: blockedUsers,
        bySchool: usersBySchool
      },
      financial: {
        summary: {
          totalInflow: financialSummary.totalInflowAmount,
          totalOutflow: financialSummary.totalOutflowAmount,
          netBalance: financialSummary.netBalance
        },
        recent: {
          inflows: {
            count: recentInflows,
            amount: totalRecentInflowAmount.length > 0 ? totalRecentInflowAmount[0].total : 0
          },
          outflows: {
            count: recentOutflows,
            amount: totalRecentOutflowAmount.length > 0 ? totalRecentOutflowAmount[0].total : 0
          }
        },
        inflows: {
          byType: inflowByType
        },
        outflows: {
          byStatus: outflowStatusDistribution
        },
        transactions: {
          total: totalTransactions,
          recent: recentTransactions,
          byStatus: transactionStatusDistribution,
          amountByStatus: transactionAmountByStatus,
          byGateway: transactionByGateway
        }
      },
      wallets: {
        total: totalWallets,
        totalBalance: walletBalance.length > 0 ? walletBalance[0].totalBalance : 0,
        averageBalance: averageWalletBalance.length > 0 ? averageWalletBalance[0].average : 0,
        emptyWallets,
        recentTransactions: recentWalletTransactions.length > 0 ? recentWalletTransactions[0].total : 0,
        transactionTypes: walletTransactionTypes,
        transactionStatus: walletTransactionStatus
      },
      storage: {
        plans: {
          total: totalStoragePlans,
          active: activeStoragePlans,
          bySize: storagePlansBySize
        },
        purchases: {
          total: totalStoragePurchases,
          recent: recentStoragePurchases
        },
        totalStorage: totalStoragePurchased.length > 0 ? totalStoragePurchased[0].totalStorage : 0,
        usedStorage: totalStorageUsed.length > 0 ? totalStorageUsed[0].usedStorage : 0,
        utilizationPercentage: storageUtilization,
        byStatus: storageStatusDistribution,
        topUsers: topStorageUsers
      },
      files: {
        total: totalFiles,
        new: newFiles,
        totalSize: totalFileSize.length > 0 ? totalFileSize[0].totalSize : 0,
        byType: fileTypeDistribution,
        byStatus: fileStatusDistribution,
        byAccess: fileAccessDistribution,
        topUsers: usersWithMostFiles,
        popularTags: popularFileTags
      },
      fileSharing: {
        total: totalFileShares,
        recent: recentFileShares,
        permissionDistribution: fileSharePermissions,
        topSharers: activeSharers,
        groupSharing: groupSharingActivity
      },
      education: {
        schools: {
          total: totalSchools,
          withMostFaculties: schoolsWithMostFaculties
        },
        faculties: {
          total: facultyCount.length > 0 ? facultyCount[0].total : 0,
          withMostDepartments: facultiesWithMostDepartments
        },
        departments: {
          total: departmentCount.length > 0 ? departmentCount[0].total : 0,
          withMostCourses: departmentsWithMostCourses
        },
        courses: {
          total: courseCount.length > 0 ? courseCount[0].total : 0
        }
      },
      groups: {
        total: totalGroups,
        new: newGroups,
        averageSize: averageGroupSize.length > 0 ? averageGroupSize[0].average : 0,
        largest: largestGroups,
        withMostFiles: groupsWithMostFiles,
        topOwners: activeGroupOwners
      },
      groupRequests: {
        total: totalGroupRequests,
        recent: recentGroupRequests,
        byStatus: groupRequestStatusDistribution,
        topRequestedGroups: groupsWithMostRequests
      },
      activity: {
        notifications: {
          total: totalNotifications,
          recent: recentNotifications,
          unreadPercentage: unreadNotificationsPercentage,
          topUsers: usersWithMostNotifications
        }
      },
      period: {
        startDate: startDateTime,
        endDate: endDateTime
      }
    };

    res.status(200).json({
      success: true,
      message: "Analytics data retrieved successfully",
      data: analytics
    });
  } catch (error) {
    console.error("Get General Analytics Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};