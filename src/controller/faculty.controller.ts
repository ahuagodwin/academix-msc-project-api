import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { School } from "../models/school.model";
import { Faculty } from "../models/faculty.model";

// Create Faculty based on the User's School
export const createFaculty = async (req: Request, res: Response):Promise<void> => {
  try {
    // Validate request input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
     res.status(400).json({ success: false, errors: errors.array() });
     return 
    }

    const { name, description } = req.body;
    const user = req.user; 

    // Ensure user has a school assigned
    if (!user.schoolName) {
      res.status(400).json({
        success: false,
        message: "You must be associated with a school to create a faculty.",
      });
      return 
    }

    // Find the school by ID
    const school = await School.findOne({schoolId: user.schoolName});
    if (!school) {
     res.status(404).json({
        success: false,
        message: "School not found.",
      });
      return 
    }

    // Check if faculty with the same name exists in the school
    const existingFaculty = await Faculty.findOne({ name: name, schoolId: school.schoolId });
    if (existingFaculty) {
      res.status(400).json({
        success: false,
        message: "A faculty with this name already exists in the school.",
      });
      return 
    }

    // Create a new Faculty
    const faculty = new Faculty({
      name,
      description,
      schoolId: school.schoolId,
      userId: user.id,
    });

    await faculty.save();

    res.status(201).json({
      success: true,
      message: "Faculty created successfully.",
      faculty,
    });
    return 
  } catch (error) {
    console.error("Error creating faculty:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
    return 
  }
};


// Get All Faculties for the User's School
export const getAllFaculties = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    // Ensure user is associated with a school
    if (!user.schoolName) {
      res.status(400).json({
        success: false,
        message: "You must be associated with a school to view faculties.",
      });
      return;
    }

    // Find faculties based on the user's school
    const faculties = await Faculty.find({ schoolId: user.schoolName }).select("-_id");

    res.status(200).json({
      success: true,
      message: "Faculties retrieved successfully.",
      faculties,
    });
    return;
  } catch (error) {
    console.error("Error retrieving faculties:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
    return;
  }
};

// Update Faculty in the User's School
export const updateFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { name, description } = req.body;
    const { facultyId } = req.params;
    const user = req.user;

    // Ensure user is associated with a school
    if (!user.schoolName) {
      res.status(400).json({
        success: false,
        message: "You must be associated with a school to update a faculty.",
      });
      return;
    }

    // Find faculty within the user's school
    const faculty = await Faculty.findOne({ facultyId: facultyId, schoolId: user.schoolName });
    if (!faculty) {
      res.status(404).json({
        success: false,
        message: "Faculty not found or does not belong to your school.",
      });
      return;
    }

    // Update faculty fields
    faculty.name = name || faculty.name;
    faculty.description = description || faculty.description;

    await faculty.save();

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully.",
      faculty,
    });
    return;
  } catch (error) {
    console.error("Error updating faculty:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
    return;
  }
};

// Delete Faculty in the User's School
export const deleteFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { facultyId } = req.params;
    const user = req.user;

    // Ensure user is associated with a school
    if (!user.schoolName) {
      res.status(400).json({
        success: false,
        message: "You must be associated with a school to delete a faculty.",
      });
      return;
    }

    // Find and delete faculty only if it belongs to the user's school
    const faculty = await Faculty.findOneAndDelete({ facultyId: facultyId, schoolId: user.schoolName });
    if (!faculty) {
      res.status(404).json({
        success: false,
        message: "Faculty not found or does not belong to your school.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully.",
    });
    return;
  } catch (error) {
    console.error("Error deleting faculty:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
    return;
  }
};
