
import { Response } from "express";
import mongoose, { Types } from "mongoose";
import { IRole, AuthenticatedRequest, ISchool } from "../types/types"; // Ensure this is correctly defined
import { User } from "../models/user.model";
import School from "../models/school.model";
import { generateInitials } from "../helpers/Helpers";
import { isSystemOwner } from "../middlewares/isSystemOwner";



// SCHOOL CONTROLLERS
export const createSchool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schools } = req.body;
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
            res.status(403).json({ error: "Only system owners can create schools", status: false });
            return;
        }

        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to create a school", status: false });
            return;
        }

        if (!Array.isArray(schools) || schools.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "At least one school name is required", status: false });
            return;
        }

        // Normalize school names (trim whitespace & convert to lowercase)
        const newSchoolNames = schools.map((name) => name.trim()).filter((name) => name.length > 0);

        if (newSchoolNames.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Invalid school names provided", status: false });
            return;
        }

        // Find existing schools (case-insensitive check)
        const existingSchools = await School.find({
            name: { $in: newSchoolNames.map((name) => new RegExp(`^${name}$`, "i")) },
        }).session(session);

        const existingSchoolNames = existingSchools.map((school) => school.name);

        // Filter out existing schools from newSchools
        const uniqueNewSchools = newSchoolNames.filter(
            (name) => !existingSchoolNames.includes(name)
        );

        if (uniqueNewSchools.length === 0) {
            await session.abortTransaction();
            res.status(409).json({
                error: `Provided schools "${existingSchoolNames.join(', ')}" already exist`,
                status: false,
            });
            return;
        }

        // Create and save new schools
        const newSchools = uniqueNewSchools.map((name) => {
            const _id = new mongoose.Types.ObjectId();
            return {
                _id,
                name,
                code: generateInitials(name),
                faculties: [],
                schoolId: _id,
            };
        });

        await School.insertMany(newSchools, { session });

        // Commit transaction
        await session.commitTransaction();

        res.status(201).json({
            message: "Schools created successfully",
            addedSchools: newSchools,
            status: true,
        });
    } catch (error) {
        console.error("Error creating schools:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};


// updating school
export const updateSchool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId } = req.params;
        const { name } = req.body;
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
            res.status(403).json({ error: "Only system owners can update schools", status: false });
            return;
        }

        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("update_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to update a school", status: false });
            return;
        }

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "A valid school name is required", status: false });
            return;
        }

        const normalizedNewName = name.trim();

        // Check if the school exists
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Check if the new name already exists (case-insensitive)
        const existingSchool = await School.findOne({ name: new RegExp(`^${normalizedNewName}$`, "i") }).session(session);
        if (existingSchool && existingSchool._id.toString() !== schoolId) {
            await session.abortTransaction();
            res.status(409).json({ error: `A school with the name "${normalizedNewName}" already exists`, status: false });
            return;
        }

        // Update the school's name and code
        school.name = normalizedNewName;
        school.code = generateInitials(normalizedNewName);

        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(200).json({
            message: "School updated successfully",
            updatedSchool: school,
            status: true,
        });
    } catch (error) {
        console.error("Error updating school:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

// deleting a school if no faculty assign
export const deleteSchool = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId } = req.params;
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
            res.status(403).json({ error: "Only system owners can delete schools", status: false });
            return;
        }

        // Check user permissions
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "You're not permitted to delete a school", status: false });
            return;
        }

        // Check if the school exists
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Ensure the school has no faculties before deleting
        if (school.faculties && school.faculties.length > 0) {
            await session.abortTransaction();
            res.status(400).json({
                error: "School cannot be deleted because faculties are associated with it",
                status: false,
            });
            return;
        }

        // Delete the school
        await School.deleteOne({ _id: schoolId }).session(session);

        // Commit transaction
        await session.commitTransaction();

        res.status(200).json({
            message: "School deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Error deleting school:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

// get all schools
export const getAllSchools = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

          // Check if the user is a system owner
          if (!isSystemOwner(userId)) {
            res.status(403).json({ error: "Only system owners can view schools", status: false });
            return;
        }

        // Fetch user and populate roles
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if the user is a system owner or has read permission
        const hasPermission = isSystemOwner(userId) || user.roles.some((role) => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "You're not permitted to view schools", status: false });
            return;
        }

        // Fetch all schools
        const schools = await School.find().select("-__v -_id");

        if (!schools || schools.length === 0) {
            res.status(404).json({ error: "No schools found", status: false });
            return;
        }

        res.status(200).json({
            message: "Schools retrieved successfully",
            schools,
            status: true,
        });
    } catch (error) {
        console.error("Error fetching schools:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

// get school by school id
export const getSchoolById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and populate roles
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has permission to view schools
        const hasPermission = user.roles.some((role) => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "You're not permitted to view school details", status: false });
            return;
        }

        // Find the school by ID
        const school = await School.findById(schoolId).select("-__v -_id");
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        res.status(200).json({ school, status: true });
    } catch (error) {
        console.error("Error fetching school:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
}



// FACULTY CONTROLLERS
export const createFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId } = req.params;
        const { faculties } = req.body; 
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "create" permission
        const hasPermission = user.roles.some(role => role.permissions.includes("create_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to create faculties", status: false });
            return;
        }

        if (!Array.isArray(faculties) || faculties.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "At least one faculty is required and cannot be empty", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Normalize faculty names (trim whitespace & convert to lowercase)
        const newFaculties = faculties
            .map(faculty => faculty.trim())
            .filter(faculty => faculty.length > 0);

        if (newFaculties.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Invalid faculty names provided", status: false });
            return;
        }

        // Get existing faculty names (case-insensitive check)
        const existingFacultyNames = new Set(
            school.faculties.map((faculty: any) => faculty.name.toLowerCase().trim())
        );

        // Filter out duplicates
        const uniqueNewFaculties = newFaculties.filter(
            faculty => !existingFacultyNames.has(faculty.toLowerCase())
        );

        if (uniqueNewFaculties.length === 0) {
            await session.abortTransaction();
            res.status(409).json({ error: `Some faculties already exist: ${faculties.map(f => f.name).join(", ")}`, status: false });
            return;
        }

        // Add new faculties
        uniqueNewFaculties.forEach(faculty => {
            school.faculties.push({
                name: faculty,
                departments: []
            });
        });

        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(201).json({
            message: `Faculties added successfully`,
            addedFaculties: uniqueNewFaculties,
            school,
            status: true,
        });
    } catch (error) {
        console.error("Error creating faculties:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const updateFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId } = req.params;
        const { name } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

         // Check if the user is a system owner
         if (!isSystemOwner(userId)) {
            await session.abortTransaction();
            res.status(403).json({ error: "Only system owners can update schools", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "update" permission
        const hasPermission = user.roles.some(role => role.permissions.includes("update_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to update faculties", status: false });
            return;
        }

        // Validate new faculty name
        if (!name || name.trim() === "") {
            await session.abortTransaction();
            res.status(400).json({ error: "Faculty name cannot be empty", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find faculty inside the school
        const faculty = school.faculties.id(facultyId);
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found", status: false });
            return;
        }

        // Check if the new name already exists
        const facultyExists = school.faculties.some(
            (fac: any) => fac.name.toLowerCase() === name.toLowerCase() && fac._id.toString() !== facultyId
        );

        if (facultyExists) {
            await session.abortTransaction();
            res.status(409).json({ error: "Faculty with this name already exists", status: false });
            return;
        }

        // Update faculty name
        faculty.name = name.trim();
        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(200).json({
            message: "Faculty updated successfully",
            updatedFaculty: faculty,
            status: true,
        });
    } catch (error) {
        console.error("Error updating faculty:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const deleteFaculty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId } = req.params;
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "delete" permission
        const hasPermission = user.roles.some(role => role.permissions.includes("delete_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to delete faculties", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find faculty inside the school
        const faculty = school.faculties.id(facultyId);
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found", status: false });
            return;
        }

        // Ensure faculty has no departments before deletion
        if (faculty.departments.length > 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Faculty cannot be deleted because it has departments", status: false });
            return;
        }

        // Remove faculty from the school
        faculty.deleteOne();
        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(200).json({
            message: "Faculty deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Error deleting faculty:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const getAllFaculties = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId } = req.params;
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "read" permission
        const hasPermission = user.roles.some(role => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view faculties", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).select("faculties");
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        res.status(200).json({
            message: "Faculties retrieved successfully",
            faculties: school.faculties,
            schoolId,
            status: true,
        });
    } catch (error) {
        console.error("Error retrieving faculties:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

export const getFacultyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId, facultyId } = req.params;
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "read" permission
        const hasPermission = user.roles.some(role => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view faculty", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).select("faculties");
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.id(facultyId);
        if (!faculty) {
            res.status(404).json({ error: "Faculty not found", status: false });
            return;
        }

        res.status(200).json({
            message: "Faculty retrieved successfully",
            faculty,
            schoolId,
            status: true,
        });
    } catch (error) {
        console.error("Error retrieving faculty:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};


// DEPARTMENT CONTROLLERS
export const createDepartments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId } = req.params;
        const { departments } = req.body; // Expecting an array of department names
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "create" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to create departments", status: false });
            return;
        }

        if (!Array.isArray(departments) || departments.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Departments array is required and cannot be empty", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) => 
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Normalize department names (trim whitespace & convert to lowercase)
        const newDepartments = departments
            .map((dept) => dept.trim())
            .filter((dept) => dept.length > 0);

        if (newDepartments.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Invalid department names provided", status: false });
            return;
        }

        // Get existing department names (case-insensitive check)
        const existingDepartmentNames = new Set(
            faculty.departments.map((dept: ISchool) => dept.name.toLowerCase())
        );

        // Filter out duplicates
        const uniqueNewDepartments = newDepartments.filter(
            (dept) => !existingDepartmentNames.has(dept.toLowerCase())
        );

        if (uniqueNewDepartments.length === 0) {
            await session.abortTransaction();
            res.status(409).json({ error: `Provided departments "${Array.from(existingDepartmentNames).join(", ")}" already exist`, status: false });
            return;
        }

        // Add new departments
        uniqueNewDepartments.forEach((dept) => {
            faculty.departments.push({ name: dept, courses: [] });
        });

        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(201).json({
            message: `Departments added successfully`,
            addedDepartments: uniqueNewDepartments,
            school,
            status: true,
        });
    } catch (error) {
        console.error("Error creating departments:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const updateDepartment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId, departmentId } = req.params;
        const { name } = req.body; // New department name
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "update" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("update_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to update departments", status: false });
            return;
        }

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "A valid department name is required", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) => 
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.id(departmentId);
        if (!department) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found", status: false });
            return;
        }

        // Check for duplicate department name within faculty
        const departmentExists = faculty.departments.some(
            (dept: ISchool) => dept.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (departmentExists) {
            await session.abortTransaction();
            res.status(409).json({ error: "A department with this name already exists", status: false });
            return;
        }

        // Update department name
        department.name = name.trim();

        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(200).json({
            message: "Department updated successfully",
            updatedDepartment: department,
            status: true,
        });
    } catch (error) {
        console.error("Error updating department:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const deleteDepartment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId, departmentId } = req.params;
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "delete" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to delete departments", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) => 
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const departmentIndex = faculty.departments.findIndex(
            (dept: any) => dept._id.toString() === departmentId
        );

        if (departmentIndex === -1) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found", status: false });
            return;
        }

        // Remove department
        faculty.departments.splice(departmentIndex, 1);
        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(200).json({
            message: "Department deleted successfully",
            status: true,
        });
    } catch (error) {
        console.error("Error deleting department:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const getAllDepartments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId, facultyId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const hasPermission = user.roles.some((role) => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view departments", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId);
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) => 
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        res.status(200).json({
            message: "Departments retrieved successfully",
            departments: faculty.departments,
            status: true,
        });
    } catch (error) {
        console.error("Error retrieving departments:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

export const getDepartmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId, facultyId, departmentId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const hasPermission = user.roles.some((role) => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view department details", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId);
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) => 
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.find((dept: any) => 
            new RegExp(`^${dept?.departmentId}$`, "i").test(departmentId)
        );
        if (!department) {
            res.status(404).json({ error: "Department not found", status: false });
            return;
        }

        res.status(200).json({
            message: "Department retrieved successfully",
            department,
            status: true,
        });
    } catch (error) {
        console.error("Error retrieving department:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};


// COURSE CONTROLLERS
export const createCourses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId, departmentId } = req.params;
        const { courses } = req.body;
        const userId = req.user?._id;

        if (!userId || !isSystemOwner(userId)) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        // Check if user has "create" permission
        const hasPermission = user.roles.some((role) => role.permissions.includes("create_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to create courses", status: false });
            return;
        }

        if (!Array.isArray(courses) || courses.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Courses array is required and cannot be empty", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) =>
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.find((dept: ISchool) =>
            new RegExp(`^${dept?._id}$`, "i").test(departmentId)
        );
        if (!department) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }

        // Normalize course names (trim whitespace & convert to lowercase)
        const newCourses = courses
            .map((course) => course.trim())
            .filter((course) => course.length > 0);

        if (newCourses.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "Invalid course names provided", status: false });
            return;
        }

        // Get existing course names (case-insensitive check)
        const existingCourseNames = new Set(
            department.courses.map((course: any) => course.name.toLowerCase())
        );

        // Filter out duplicates
        const uniqueNewCourses = newCourses.filter(
            (course) => !existingCourseNames.has(course.toLowerCase())
        );

        if (uniqueNewCourses.length === 0) {
            await session.abortTransaction();
            res.status(409).json({ error: "All provided courses already exist", status: false });
            return;
        }

        // Add new courses
        uniqueNewCourses.forEach((course) => {
            department.courses.push({ name: course });
        });

        await school.save({ session });

        // Commit transaction
        await session.commitTransaction();

        res.status(201).json({
            message: `Courses added successfully`,
            addedCourses: uniqueNewCourses,
            school,
            status: true,
        });
    } catch (error) {
        console.error("Error creating courses:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const updateCourse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId, departmentId, courseId } = req.params;
        const { name: updatedCourseName } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const hasPermission = user.roles.some((role) => role.permissions.includes("update_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to update courses", status: false });
            return;
        }

        if (!updatedCourseName || typeof updatedCourseName !== "string") {
            await session.abortTransaction();
            res.status(400).json({ error: "Valid course name is required", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) =>
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.find((dept: ISchool) =>
            new RegExp(`^${dept?._id}$`, "i").test(departmentId)
        );
        if (!department) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }

        // Find the course within the department
        const course = department.courses.find((c: ISchool) =>
            new RegExp(`^${c?._id}$`, "i").test(courseId)
        );
        if (!course) {
            await session.abortTransaction();
            res.status(404).json({ error: "Course not found", status: false });
            return;
        }

        // Normalize course name and check for duplicates
        const normalizedNewName = updatedCourseName.trim().toLowerCase();
        const existingCourseNames = department.courses.map((c: ISchool) => c.name.toLowerCase());

        if (existingCourseNames.includes(normalizedNewName)) {
            await session.abortTransaction();
            res.status(409).json({ error: "A course with this name already exists", status: false });
            return;
        }

        // Update the course name
        course.name = updatedCourseName.trim();
        await school.save({ session });

        await session.commitTransaction();
        res.status(200).json({
            message: "Course updated successfully",
            updatedCourse: course,
            status: true,
        });
    } catch (error) {
        console.error("Error updating course:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const deleteCourse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { schoolId, facultyId, departmentId, courseId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles").session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const hasPermission = user.roles.some((role) => role.permissions.includes("delete_school"));
        if (!hasPermission) {
            await session.abortTransaction();
            res.status(403).json({ error: "Unauthorized to delete courses", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) =>
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.find((dept: ISchool) =>
            new RegExp(`^${dept?._id}$`, "i").test(departmentId)
        );
        if (!department) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }

        // Find and remove the course
        const courseIndex = department.courses.findIndex((c: any) =>
            new RegExp(`^${c?._id}$`, "i").test(courseId)
        );

        if (courseIndex === -1) {
            await session.abortTransaction();
            res.status(404).json({ error: "Course not found", status: false });
            return;
        }

        const removedCourse = department.courses.splice(courseIndex, 1);
        await school.save({ session });

        await session.commitTransaction();
        res.status(200).json({
            message: "Course deleted successfully",
            removedCourse,
            status: true,
        });
    } catch (error) {
        console.error("Error deleting course:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

export const getAllCourses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId, facultyId, departmentId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const hasPermission = user.roles.some((role) => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view courses", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId);
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) =>
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.find((dept: ISchool) =>
            new RegExp(`^${dept?._id}$`, "i").test(departmentId)
        );
        if (!department) {
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }

        // Retrieve courses
        const courses = department.courses;

        res.status(200).json({
            message: "Courses retrieved successfully",
            courses,
            status: true,
        });
    } catch (error) {
        console.error("Error retrieving courses:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

export const getCourseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { schoolId, facultyId, departmentId, courseId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized access", status: false });
            return;
        }

        // Fetch user and check permissions
        const user = await User.findById(userId).populate<{ roles: IRole[] }>("roles");
        if (!user) {
            res.status(404).json({ error: "User not found", status: false });
            return;
        }

        const hasPermission = user.roles.some((role) => role.permissions.includes("read_school"));
        if (!hasPermission) {
            res.status(403).json({ error: "Unauthorized to view course", status: false });
            return;
        }

        // Find the school
        const school = await School.findById(schoolId);
        if (!school) {
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Find the faculty within the school
        const faculty = school.faculties.find((faculty: any) =>
            new RegExp(`^${faculty?.facultyId}$`, "i").test(facultyId)
        );
        if (!faculty) {
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Find the department within the faculty
        const department = faculty.departments.find((dept: ISchool) =>
            new RegExp(`^${dept?._id}$`, "i").test(departmentId)
        );
        if (!department) {
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }

        // Find the course within the department
        const course = department.courses.find((course: any) =>
            new RegExp(`^${course?._id}$`, "i").test(courseId)
        );

        if (!course) {
            res.status(404).json({ error: "Course not found in this department", status: false });
            return;
        }

        res.status(200).json({
            message: "Course retrieved successfully",
            course,
            status: true,
        });
    } catch (error) {
        console.error("Error retrieving course:", error);
        res.status(500).json({ error: "Internal server error", status: false });
    }
};

