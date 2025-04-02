"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAssignedTeachersById = exports.getAllAssignedTeachers = exports.deleteAssignedTeacher = exports.updateAssignedTeacher = exports.assignTeacher = void 0;
const types_1 = require("../types/types");
const school_model_1 = __importDefault(require("../models/school.model"));
const user_model_1 = require("../models/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
// TEACHER'S CONTROLLER
// Assign Faculty, Department, and Courses to a Teacher
const assignTeacher = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { teacherId } = req.params;
        const { schoolId, facultyId, departmentId, courses } = req.body;
        // Validate teacher existence
        const teacher = await user_model_1.User.findById(teacherId).session(session);
        if (!teacher || teacher.user_type !== types_1.UserType.TEACHER) {
            await session.abortTransaction();
            res.status(404).json({ error: "Teacher not found or not a valid TEACHER", status: false });
            return;
        }
        // Validate school existence
        const school = await school_model_1.default.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }
        // Validate faculty within the school
        const faculty = school.faculties.find((faculty) => String(faculty._id) === facultyId);
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }
        // Validate department within the faculty
        const department = faculty.departments.find((dept) => String(dept._id) === departmentId);
        if (!department) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }
        // Validate courses existence
        const departmentCourseNames = new Set(department.courses.map((course) => course.name.toLowerCase()));
        const validCourses = courses.filter((course) => departmentCourseNames.has(course.toLowerCase()));
        if (validCourses.length === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "None of the provided courses exist in the department", status: false });
            return;
        }
        // Assign faculty, department, and courses to teacher
        teacher.assignedFaculty = [facultyId];
        teacher.assignedDepartment = [departmentId];
        teacher.assignedCourses = validCourses;
        await teacher.save({ session });
        // Commit transaction
        await session.commitTransaction();
        res.status(200).json({
            message: "Teacher assigned successfully",
            assignedFaculty: facultyId,
            assignedDepartment: departmentId,
            assignedCourses: validCourses,
            status: true,
        });
    }
    catch (error) {
        console.error("Error assigning teacher:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    }
    finally {
        session.endSession();
    }
};
exports.assignTeacher = assignTeacher;
// uPDATE Assign Faculty, Department, and Courses to a Teacher
const updateAssignedTeacher = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { teacherId } = req.params;
        const { schoolId, facultyId, departmentId, courses } = req.body;
        // Validate teacher
        const teacher = await user_model_1.User.findById(teacherId);
        if (!teacher || teacher.user_type !== types_1.UserType.TEACHER) {
            await session.abortTransaction();
            res.status(404).json({ error: "Teacher not found or invalid user type", status: false });
            return;
        }
        // Validate school
        const school = await school_model_1.default.findById(schoolId);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }
        // Validate faculty
        if (facultyId && !school.faculties.includes(facultyId)) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }
        // Validate department
        if (departmentId && !school.departments.includes(departmentId)) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found in this school", status: false });
            return;
        }
        // Update only provided fields
        if (facultyId)
            teacher.assignedFaculty = [new mongoose_1.default.Types.ObjectId(`${facultyId}`)];
        if (departmentId)
            teacher.assignedDepartment = [new mongoose_1.default.Types.ObjectId(`${departmentId}`)];
        //   if (facultyId) teacher.assignedFaculty = [facultyId];
        //   if (departmentId) teacher.assignedDepartment = [departmentId];
        if (Array.isArray(courses) && courses.length > 0) {
            // Ensuring `assignedCourses` is always an array before spreading
            teacher.assignedCourses = [
                ...new Set([
                    ...(Array.isArray(teacher.assignedCourses) ? teacher.assignedCourses : []),
                    ...courses.map((course) => new mongoose_1.default.Types.ObjectId(course)),
                ]),
            ];
        }
        await teacher.save();
        // Commit transaction
        await session.commitTransaction();
        res.status(200).json({
            message: "Teacher assignment updated successfully",
            assignedFaculty: teacher.assignedFaculty,
            assignedDepartment: teacher.assignedDepartment,
            assignedCourses: teacher.assignedCourses,
            status: true,
        });
        return;
    }
    catch (error) {
        console.error("Error updating assigned teacher:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal Server Error", status: false });
        return;
    }
    finally {
        session.endSession();
    }
};
exports.updateAssignedTeacher = updateAssignedTeacher;
const deleteAssignedTeacher = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { teacherId, schoolId } = req.params;
        const { facultyId, departmentId, courses } = req.body;
        // Validate teacher
        const teacher = await user_model_1.User.findOne({ _id: teacherId, school: schoolId });
        if (!teacher || teacher.user_type !== "TEACHER") {
            await session.abortTransaction();
            res.status(404).json({ error: "Teacher not found or invalid user type", status: false });
            return;
        }
        // Remove faculty if provided
        if (facultyId && teacher.assignedFaculty) {
            teacher.assignedFaculty = teacher.assignedFaculty.filter((id) => id.toString() !== facultyId);
        }
        // Remove department if provided
        if (departmentId && teacher.assignedDepartment) {
            teacher.assignedDepartment = teacher.assignedDepartment.filter((id) => id.toString() !== departmentId);
        }
        // Remove courses if provided
        if (Array.isArray(courses) && courses.length > 0 && teacher.assignedCourses) {
            teacher.assignedCourses = teacher.assignedCourses.filter((id) => !courses.includes(id.toString()));
        }
        await teacher.save();
        await session.commitTransaction();
        res.status(200).json({
            message: "Assigned data removed successfully",
            assignedFaculty: teacher.assignedFaculty,
            assignedDepartment: teacher.assignedDepartment,
            assignedCourses: teacher.assignedCourses,
            status: true,
        });
        return;
    }
    catch (error) {
        console.error("Error deleting assigned data:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal Server Error", status: false });
        return;
    }
    finally {
        session.endSession();
    }
};
exports.deleteAssignedTeacher = deleteAssignedTeacher;
const getAllAssignedTeachers = async (req, res) => {
    try {
        const { schoolId } = req.params;
        // Find all teachers in the given school who have assigned faculties, departments, or courses
        const teachers = await user_model_1.User.find({
            school: schoolId,
            user_type: types_1.UserType.TEACHER,
            $or: [
                { assignedFaculty: { $exists: true, $not: { $size: 0 } } },
                { assignedDepartment: { $exists: true, $not: { $size: 0 } } },
                { assignedCourses: { $exists: true, $not: { $size: 0 } } },
            ],
        }).select("-password");
        res.status(200).json({
            message: "Assigned teachers retrieved successfully",
            assignedTeachers: teachers,
            status: true,
        });
        return;
    }
    catch (error) {
        console.error("Error fetching assigned teachers:", error);
        res.status(500).json({ error: "Internal Server Error", status: false });
        return;
    }
};
exports.getAllAssignedTeachers = getAllAssignedTeachers;
const getAllAssignedTeachersById = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const teachers = await user_model_1.User.findOne({
            school: schoolId,
            userId: teacherId,
            user_type: types_1.UserType.TEACHER,
            $or: [
                { assignedFaculty: { $exists: true, $not: { $size: 0 } } },
                { assignedDepartment: { $exists: true, $not: { $size: 0 } } },
                { assignedCourses: { $exists: true, $not: { $size: 0 } } },
            ],
        }).select("-password");
        res.status(200).json({
            message: "Assigned teachers retrieved successfully",
            assignedTeachers: teachers,
            status: true,
        });
        return;
    }
    catch (error) {
        console.error("Error fetching assigned teachers:", error);
        res.status(500).json({ error: "Internal Server Error", status: false });
        return;
    }
};
exports.getAllAssignedTeachersById = getAllAssignedTeachersById;
