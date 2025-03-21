import { UserType } from "../types/types";
import School from "../models/school.model";
import { User } from "../models/user.model";
import { Request, Response } from "express";
import mongoose from "mongoose";


// TEACHER'S CONTROLLER

// Assign Faculty, Department, and Courses to a Teacher
export const assignTeacher = async (req: Request, res: Response):Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { teacherId } = req.params;
        const { schoolId, facultyId, departmentId, courses } = req.body;

        // Validate teacher existence
        const teacher = await User.findById(teacherId).session(session);
        if (!teacher || teacher.user_type !== UserType.TEACHER) {
            await session.abortTransaction();
            res.status(404).json({ error: "Teacher not found or not a valid TEACHER", status: false });
            return;
        }

        // Validate school existence
        const school = await School.findById(schoolId).session(session);
        if (!school) {
            await session.abortTransaction();
            res.status(404).json({ error: "School not found", status: false });
            return;
        }

        // Validate faculty within the school
        const faculty = school.faculties.find((faculty: any) => String(faculty._id) === facultyId);
        if (!faculty) {
            await session.abortTransaction();
            res.status(404).json({ error: "Faculty not found in this school", status: false });
            return;
        }

        // Validate department within the faculty
        const department = faculty.departments.find((dept: any) => String(dept._id) === departmentId);
        if (!department) {
            await session.abortTransaction();
            res.status(404).json({ error: "Department not found in this faculty", status: false });
            return;
        }

        // Validate courses existence
        const departmentCourseNames = new Set(department.courses.map((course: any) => course.name.toLowerCase()));
        const validCourses = courses.filter((course: string) => departmentCourseNames.has(course.toLowerCase()));

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
    } catch (error) {
        console.error("Error assigning teacher:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Internal server error", status: false });
    } finally {
        session.endSession();
    }
};

// uPDATE Assign Faculty, Department, and Courses to a Teacher
export const updateAssignedTeacher = async (req: Request, res: Response):Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

    try {
      const { teacherId } = req.params;
      const { schoolId, facultyId, departmentId, courses } = req.body;
  
      // Validate teacher
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.user_type !== UserType.TEACHER) {
        await session.abortTransaction();
        res.status(404).json({ error: "Teacher not found or invalid user type", status: false });
        return 
      }
  
      // Validate school
      const school = await School.findById(schoolId);
      if (!school) {
        await session.abortTransaction();
        res.status(404).json({ error: "School not found", status: false });
        return 
      }
  
      // Validate faculty
      if (facultyId && !school.faculties.includes(facultyId)) {
        await session.abortTransaction();
        res.status(404).json({ error: "Faculty not found in this school", status: false });
        return 
      }
  
      // Validate department
      if (departmentId && !school.departments.includes(departmentId)) {
        await session.abortTransaction();
        res.status(404).json({ error: "Department not found in this school", status: false });
        return 
      }
  

       // Update only provided fields
        if (facultyId) teacher.assignedFaculty = [new mongoose.Types.ObjectId(`${facultyId}`)];
        if (departmentId) teacher.assignedDepartment = [new mongoose.Types.ObjectId(`${departmentId}`)];
        
        //   if (facultyId) teacher.assignedFaculty = [facultyId];
        //   if (departmentId) teacher.assignedDepartment = [departmentId];
      
      if (Array.isArray(courses) && courses.length > 0) {
        // Ensuring `assignedCourses` is always an array before spreading
        teacher.assignedCourses = [
          ...new Set([
            ...(Array.isArray(teacher.assignedCourses) ? teacher.assignedCourses : []),
            ...courses.map((course: string) => new mongoose.Types.ObjectId(course)),
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
      return 
  
    } catch (error) {
      console.error("Error updating assigned teacher:", error);
      await session.abortTransaction();
      res.status(500).json({ error: "Internal Server Error", status: false });
      return 
    } finally {
      session.endSession();
    }
  };

export const deleteAssignedTeacher = async (req: Request, res: Response):Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { teacherId, schoolId } = req.params;
    const { facultyId, departmentId, courses } = req.body;

    // Validate teacher
    const teacher = await User.findOne({ _id: teacherId, school: schoolId });

    if (!teacher || teacher.user_type !== "TEACHER") {
      await session.abortTransaction();
      res.status(404).json({ error: "Teacher not found or invalid user type", status: false });
      return
    }

    // Remove faculty if provided
    if (facultyId && teacher.assignedFaculty) {
      teacher.assignedFaculty = teacher.assignedFaculty.filter(
        (id) => id.toString() !== facultyId
      );
    }

    // Remove department if provided
    if (departmentId && teacher.assignedDepartment) {
      teacher.assignedDepartment = teacher.assignedDepartment.filter(
        (id) => id.toString() !== departmentId
      );
    }

    // Remove courses if provided
    if (Array.isArray(courses) && courses.length > 0 && teacher.assignedCourses) {
      teacher.assignedCourses = teacher.assignedCourses.filter(
        (id) => !courses.includes(id.toString())
      );
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
    return 
  } catch (error) {
    console.error("Error deleting assigned data:", error);
    await session.abortTransaction();
    res.status(500).json({ error: "Internal Server Error", status: false });
    return 
  } finally {
    session.endSession();
  }
};

export const getAllAssignedTeachers = async (req: Request, res: Response):Promise<void> => {
    try {
      const { schoolId } = req.params;
  
      // Find all teachers in the given school who have assigned faculties, departments, or courses
      const teachers = await User.find({
        school: schoolId,
        user_type: UserType.TEACHER,
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
      return 
    } catch (error) {
      console.error("Error fetching assigned teachers:", error);
       res.status(500).json({ error: "Internal Server Error", status: false });
       return
    }
  };

export const getAllAssignedTeachersById = async (req: Request, res: Response):Promise<void> => {
    try {
      const { schoolId, teacherId } = req.params;

      const teachers = await User.findOne({
        school: schoolId,
        userId: teacherId,
        user_type: UserType.TEACHER,
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
      return 
    } catch (error) {
      console.error("Error fetching assigned teachers:", error);
      res.status(500).json({ error: "Internal Server Error", status: false });
      return 
    }};