"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileAnalytics = exports.updateFileWithUpload = exports.getFileById = exports.getAllFiles = exports.deleteFile = exports.getUserFiles = exports.createFile = void 0;
const user_model_1 = require("../models/user.model");
const file_model_1 = __importDefault(require("../models/file.model"));
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const types_1 = require("../types/types");
const mongoose_1 = __importDefault(require("mongoose"));
const isSystemOwner_1 = require("../middlewares/isSystemOwner");
const storage_1 = require("../helpers/storage");
const Helpers_1 = require("../helpers/Helpers");
const createFile = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id;
        if (!userId) {
            await session.abortTransaction();
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_file"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to create a file", status: false });
            return;
        }
        //  Check if a file was uploaded
        if (!req.file) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "No file uploaded" });
            return;
        }
        const { originalname, mimetype, size, filename } = req.file;
        console.log("File uploaded:", filename);
        // Step 1: Validate File Extension
        const allowedExtensions = ["png", "jpeg", "jpg", "fig", "docx", "doc", "pdf", "xls", "xlsx", "mp4", "pptx"];
        const fileExtension = originalname.split(".").pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Invalid file type. Allowed formats: png, jpeg, jpg, fig, docx, doc, pdf, xls, xlsx, mp4, pptx" });
            return;
        }
        // Step 2: Check Storage Plan
        const storagePlan = await subscription_model_1.default.findOne({ user: userId, status: { $in: [types_1.StorageStatus.active, types_1.StorageStatus.low] } }).session(session);
        if (!storagePlan) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "No active storage plan found. Please purchase storage." });
            return;
        }
        const availableStorage = storagePlan.totalStorage - storagePlan.usedStorage;
        // Step 3: Check Storage Status
        if (storagePlan.status === types_1.StorageStatus.exhausted) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Your storage is exhausted. Please upgrade your plan." });
            return;
        }
        if (size > availableStorage) {
            await session.abortTransaction();
            res.status(400).json({ success: false, message: "Not enough storage space available. Please upgrade your plan." });
            return;
        }
        // Step 4: Deduct Used Storage
        storagePlan.usedStorage += size;
        // Step 5: Update Storage Status
        const remainingStorage = storagePlan.totalStorage - storagePlan.usedStorage;
        storagePlan.status =
            remainingStorage <= 0 ? types_1.StorageStatus.exhausted : remainingStorage < 10 * 1024 * 1024 ? types_1.StorageStatus.low : types_1.StorageStatus.active;
        await storagePlan.save({ session });
        // Step 6: Save File
        const newFile = new file_model_1.default({
            userId: userId,
            name: originalname,
            fileType: mimetype,
            size,
            storagePath: `/uploads/${filename}`,
            access: "private",
            tags: [],
        });
        await newFile.save({ session });
        await session.commitTransaction();
        res.status(201).json({ success: true, message: "File uploaded successfully", data: newFile });
    }
    catch (error) {
        console.error("File Upload Error:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.createFile = createFile;
// all file uploaded by a user
const getUserFiles = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Fetch user and populate roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_file"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to view files", status: false });
            return;
        }
        // Pagination and query
        const { page, limit, ...filters } = req.query;
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        const query = {
            ...(0, Helpers_1.buildQuery)(filters, ["name"]),
            userId, // fetch only the logged-in user's files
        };
        const totalRecords = await file_model_1.default.countDocuments(query);
        const files = await file_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select("-__v")
            .populate("userId", "firstName lastName email")
            .populate({
            path: "sharedTo",
            select: "recipients",
            populate: { path: "recipients", select: "_id" },
        });
        const enrichedFiles = files.map((file) => ({
            ...file.toObject(),
            sharedCount: file.sharedTo && "recipients" in file.sharedTo
                ? file.sharedTo.recipients.length
                : 0,
        }));
        await session.commitTransaction();
        res.status(200).json({
            success: true,
            message: "User files retrieved successfully",
            data: enrichedFiles,
            pagination: (0, Helpers_1.paginateResults)(totalRecords, pageNumber, limitNumber),
        });
    }
    catch (error) {
        await session.abortTransaction();
        console.error("Error retrieving user files:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.getUserFiles = getUserFiles;
// delete a file
const deleteFile = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.user?._id;
        const { fileId } = req.params;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Find user and check roles
        const user = await user_model_1.User.findById(userId).populate("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Check user permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_file"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to delete this file", status: false });
            return;
        }
        // Find file by ID
        const file = await file_model_1.default.findOne({ _id: fileId, userId }).session(session);
        if (!file) {
            await session.abortTransaction();
            res.status(404).json({ success: false, message: "File not found or not owned by you" });
            return;
        }
        // Delete file from database
        await file_model_1.default.deleteOne({ _id: fileId }).session(session);
        // Commit transaction
        await session.commitTransaction();
        res.status(200).json({
            success: true,
            message: "File deleted successfully",
        });
    }
    catch (error) {
        console.error("File Deletion Error:", error);
        await session.abortTransaction();
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    finally {
        session.endSession();
    }
};
exports.deleteFile = deleteFile;
const getAllFiles = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Find user and check roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            res.status(401).json({ success: false, message: "You do not have permission to view all files" });
            return;
        }
        // Check user permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_file"));
        if (!hasPermission) {
            res.status(403).json({ error: "You're not permitted to view all files", status: false });
            return;
        }
        // extracting query parameters
        const { page, limit, ...filters } = req.query;
        // applying pagination and filters
        const { pageNumber, limitNumber, skip } = (0, Helpers_1.paginate)(page, limit);
        const query = (0, Helpers_1.buildQuery)(filters, ["name"]);
        const totalRecords = await file_model_1.default.countDocuments(query);
        // Fetch all files
        const files = await file_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select("-__v")
            .populate("userId", "firstName lastName email")
            .populate({
            path: "sharedTo",
            select: "recipients",
            populate: { path: "recipients", select: "_id" }
        });
        const enrichedFiles = files.map((file) => ({
            ...file.toObject(),
            sharedCount: file.sharedTo && "recipients" in file.sharedTo
                ? file.sharedTo.recipients.length
                : 0
        }));
        res.status(200).json({
            success: true,
            message: "All files retrieved successfully",
            data: enrichedFiles,
            pagination: (0, Helpers_1.paginateResults)(totalRecords, pageNumber, limitNumber),
        });
    }
    catch (error) {
        console.error("Fetch All Files Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getAllFiles = getAllFiles;
const getFileById = async (req, res) => {
    try {
        const userId = req.user?._id;
        const fileId = req.params.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Validate file ID
        if (!mongoose_1.default.Types.ObjectId.isValid(fileId)) {
            res.status(400).json({ success: false, message: "Invalid file ID" });
            return;
        }
        // Find file
        const file = await file_model_1.default.findById(fileId);
        if (!file) {
            res.status(404).json({ success: false, message: "File not found" });
            return;
        }
        // Find user and check roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        // Permission check: Only file owner or admin can view it
        const isOwner = file.userId.toString() === userId.toString();
        const hasPermission = user.roles.some((role) => role.permissions.includes("view_all_files"));
        if (!isOwner && !hasPermission || !(0, isSystemOwner_1.isSystemOwner)(userId)) {
            res.status(403).json({ error: "You do not have permission to view this file", status: false });
            return;
        }
        res.status(200).json({
            success: true,
            message: "File retrieved successfully",
            data: file,
        });
    }
    catch (error) {
        console.error("Fetch File By ID Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getFileById = getFileById;
const updateFileWithUpload = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { fileId } = req.params;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Find the file
        const file = await file_model_1.default.findById(fileId);
        if (!file) {
            res.status(404).json({ success: false, message: "File not found" });
            return;
        }
        // Check if the user is the owner
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        const isOwner = file.userId.toString() === userId.toString();
        const hasPermission = user.roles.some((role) => role.permissions.includes("update_file"));
        if (!isOwner && !hasPermission || !(0, isSystemOwner_1.isSystemOwner)(userId)) {
            res.status(403).json({ error: "You do not have permission to update this file", status: false });
            return;
        }
        // Handle optional metadata update
        const { name, tags, access, status } = req.body;
        if (name)
            file.name = name;
        if (tags) {
            file.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
        }
        if (access)
            file.access = access;
        if (status)
            file.status = status;
        // Check if a new file is uploaded
        if (req.file) {
            try {
                // Delete old file from storage
                await (0, storage_1.deleteFileFromStorage)(file.storagePath);
                // Upload new file
                const newStoragePath = await (0, storage_1.uploadFileToStorage)(req.file);
                // Update file details
                file.storagePath = newStoragePath;
                file.size = req.file.size;
                file.fileType = req.file.mimetype;
            }
            catch (uploadError) {
                res.status(500).json({ success: false, message: "File upload failed", error: uploadError.message });
                return;
            }
        }
        await file.save();
        const updatedFile = await file_model_1.default.findByIdAndUpdate(fileId, file, { new: true });
        res.status(200).json({ success: true, message: "File updated successfully", data: updatedFile });
    }
    catch (error) {
        console.error("File Update Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.updateFileWithUpload = updateFileWithUpload;
const getFileAnalytics = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        // Find user and check roles
        const user = await user_model_1.User.findById(userId).populate("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }
        if (!(0, isSystemOwner_1.isSystemOwner)(userId)) {
            res.status(401).json({ success: false, message: "You do not have permission to view all files analytics" });
            return;
        }
        // Check user permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_file_analytics"));
        if (!hasPermission) {
            res.status(403).json({ error: "You're not permitted to view all files analytics", status: false });
            return;
        }
        // Fetch all files from the database
        const files = await file_model_1.default.find()
            .populate("sharedTo")
            .populate("userId", "firstName lastName email");
        // File type counters
        const fileTypeCount = {
            png: 0,
            pdf: 0,
            docx: 0,
            jpeg: 0,
            jpg: 0,
            ppt: 0,
            doc: 0,
            mp4: 0,
            pptx: 0,
            xls: 0,
            xlsx: 0,
            fig: 0,
            total: 0,
            totalShared: 0
        };
        let totalSize = 0;
        files.forEach((file) => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext && fileTypeCount[ext] !== undefined) {
                fileTypeCount[ext]++;
            }
            // Count total number of shared files with recipients
            const sharedToRecipientsCount = file.sharedTo && "recipients" in file.sharedTo
                ? file.sharedTo.recipients.length
                : 0;
            if (sharedToRecipientsCount > 0) {
                fileTypeCount.totalShared++;
            }
            // Add to the total size
            totalSize += (0, Helpers_1.parseStorageSize)(file.size);
        });
        // Convert total size to human-readable format
        const readableTotalSize = (0, Helpers_1.formatStorageSize)(totalSize);
        res.status(200).json({
            success: true,
            message: "File analytics retrieved successfully",
            data: {
                ...fileTypeCount,
                totalSize: readableTotalSize,
                totalFileCount: files.length,
                totalSharedFiles: fileTypeCount.totalShared,
            }
        });
    }
    catch (error) {
        console.error("Error fetching file analytics:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getFileAnalytics = getFileAnalytics;
// export const getUserFilesByID  = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//   try {
//     const requesterId = req.user?._id;
//     const { userId } = req.params;
//     if (!requesterId) {
//       res.status(401).json({ success: false, message: "Unauthorized access" });
//       return;
//     }
//     const user = await User.findById(requesterId).populate<{ roles: IRole[] }>("roles");
//     if (!user) {
//       res.status(404).json({ success: false, message: "User not found" });
//       return;
//     }
//     const isOwner = isSystemOwner(requesterId);
//     const hasPermission = user.roles.some((role) => role.permissions.includes("read_file"));
//     if (!isOwner && !hasPermission && requesterId.toString() !== userId) {
//       res.status(403).json({ success: false, message: "You do not have permission to view these files" });
//       return;
//     }
//     // Query and pagination
//     const { page, limit, ...filters } = req.query;
//     const { pageNumber, limitNumber, skip } = paginate(page, limit);
//     const query = {
//       ...buildQuery(filters, ["name"]),
//       userId: userId, // filter strictly by passed userId
//     };
//     const totalRecords = await File.countDocuments(query);
//     const files = await File.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limitNumber)
//       .select("-__v")
//       .populate("userId", "firstName lastName email")
//       .populate({
//         path: "sharedTo",
//         select: "recipients",
//         populate: { path: "recipients", select: "_id" },
//       });
//     const enrichedFiles = files.map((file) => ({
//       ...file.toObject(),
//       sharedCount:
//         file.sharedTo && "recipients" in file.sharedTo
//           ? (file.sharedTo as IShare).recipients.length
//           : 0,
//     }));
//     res.status(200).json({
//       success: true,
//       message: `Files retrieved for user ${userId}`,
//       data: enrichedFiles,
//       pagination: paginateResults(totalRecords, pageNumber, limitNumber),
//     });
//   } catch (error) {
//     console.error("Error fetching files by userId:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
// TODO: I will need to implement this cloudinary and firebase file management when moving to large app like "Global Settings"
// export const createFileWithCloudinaryAndFirebase = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId) return res.status(401).json({ success: false, message: "Unauthorized access" });
//     // Check user permissions
//     const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
//     if (!user || !user.roles.some(role => role.permissions.includes("create_file"))) {
//       return res.status(403).json({ success: false, message: "You're not permitted to create a file" });
//     }
//     upload(req, res, async (err) => {
//       if (err || !req.file) return res.status(400).json({ success: false, message: "File upload error" });
//       const { originalname, mimetype, buffer } = req.file;
//       const { storageProvider } = req.body; // 'cloudinary' or 'firebase'
//       let fileUrl;
//       if (storageProvider === "cloudinary") {
//         const result: any = await uploadFileToCloudinary(buffer, originalname);
//         fileUrl = result.secure_url;
//       } else {
//         const urls = await uploadFileToFirebase(buffer, originalname);
//         fileUrl = urls[0];
//       }
//       const newFile = new File({ userId, name: originalname, fileType: mimetype, storagePath: fileUrl, access: "private" });
//       await newFile.save();
//       res.status(201).json({ success: true, message: "File uploaded successfully", data: newFile });
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
// /**
//  * Update an existing file
//  */
// export const updateFileWithCloudinaryAndFirebase = async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { fileId } = req.params;
//     const { name, tags, storageProvider } = req.body;
//     const userId = req.user?._id;
//     const file = await File.findOne({ _id: fileId, userId });
//     if (!file) return res.status(404).json({ success: false, message: "File not found" });
//     upload(req, res, async (err) => {
//       if (err) return res.status(400).json({ success: false, message: "File upload error" });
//       if (req.file) {
//         const { originalname, mimetype, buffer } = req.file;
//         let fileUrl;
//         if (storageProvider === "cloudinary") {
//           const result: any = await uploadFileToCloudinary(buffer, originalname);
//           fileUrl = result.secure_url;
//         } else {
//           const urls = await uploadFileToFirebase(buffer, originalname);
//           fileUrl = urls[0];
//         }
//         file.storagePath = fileUrl;
//       }
//       if (name) file.name = name;
//       if (tags) file.tags = tags;
//       await file.save();
//       res.status(200).json({ success: true, message: "File updated successfully", data: file });
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
