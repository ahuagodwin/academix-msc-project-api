import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Faculty } from "../models/faculty.model";
import { Department } from "../models/department.model";
import { generateInitials } from "../utils/utils";

// Create Department based on User's School and Faculty
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, description, facultyId } = req.body;
    const user = req.user;

    // Ensure user is associated with a school
    if (!user.schoolName) {
      res.status(400).json({
        success: false,
        message: "You must be associated with a school to create a department.",
      });
      return;
    }

    // Find the faculty within the user's school
    const faculty = await Faculty.findOne({ facultyId: facultyId, schoolId: user.schoolName });

    if (!faculty) {
      res.status(404).json({
        success: false,
        message: "Faculty not found or does not belong to your school.",
      });
      return;
    }

    // Check if the department already exists in the faculty
    const existingDepartment = await Department.findOne({ name: name, facultyId: facultyId });
    if (existingDepartment) {
      res.status(400).json({
        success: false,
        message: `A department with this name (${name}) already exists in the faculty.`,
      });
      return;
    }

    // Create the new department
    const department = new Department({
      name,
      description,
      facultyId,
      schoolId: user.schoolName,
      userId: user.id,
      code: generateInitials(name),
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: "Department created successfully.",
      department,
    });
    return;
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
    return;
  }
};



// update department
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }
  
      const { departmentId } = req.params;
      const { name, description } = req.body;
      const user = req.user;
  
      // Ensure user is associated with a school
      if (!user.schoolName) {
        res.status(400).json({
          success: false,
          message: "You must be associated with a school to update a department.",
        });
        return;
      }
  
      // Find the department within the user's school
      const department = await Department.findOne({ departmentId: departmentId, userId: user.id });
  
      if (!department) {
        res.status(404).json({
          success: false,
          message: "Department not found or does not belong to your school.",
        });
        return;
      }
  
      // Update department details
      department.name = name || department.name;
      department.description = description || department.description;
  
      await department.save();
  
      res.status(200).json({
        success: true,
        message: "Department updated successfully.",
        department,
      });
      return;
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
      return;
    }
  };
  

// to delete department
  export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentId } = req.params;
      const user = req.user;
  
      // Ensure user is associated with a school
      if (!user.schoolName) {
        res.status(400).json({
          success: false,
          message: "You must be associated with a school to delete a department.",
        });
        return;
      }
  
      // Find the department within the user's school
      const department = await Department.findOneAndDelete({ departmentId: departmentId, userId: user.id });
  
      if (!department) {
        res.status(404).json({
          success: false,
          message: "Department not found or does not belong to your school.",
        });
        return;
      }
  
      res.status(200).json({
        success: true,
        message: "Department deleted successfully.",
      });
      return;
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
      return;
    }
  };
  

//   get all department
  export const getAllDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
  
      // Ensure user is associated with a school
      if (!user.schoolName) {
        res.status(400).json({
          success: false,
          message: "You must be associated with a school to view departments.",
        });
        return;
      }
  
      // Retrieve all departments within the user's school
      const departments = await Department.find({ userId: user.id,  }).select("-_id");
  
      res.status(200).json({
        success: true,
        message: "Departments retrieved successfully.",
        departments,
      });
      return;
    } catch (error) {
      console.error("Error retrieving departments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
      return;
    }
  };



//   get all department
export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
      const user = req.user;
  
      // Ensure user is associated with a school
      if (!user.schoolName) {
        res.status(400).json({
          success: false,
          message: "You must be associated with a school to view departments.",
        });
        return;
      }
  
      // Retrieve all departments within the user's school
      const departments = await Department.findOne({ departmentId: departmentId,  userId: user.id,  }).select("-_id");
  
      res.status(200).json({
        success: true,
        message: "Department retrieved successfully.",
        departments,
      });
      return;
    } catch (error) {
      console.error("Error retrieving department:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error. Please try again later.",
      });
      return;
    }
  };
  