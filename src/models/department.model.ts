import mongoose, { Schema, Document, Model } from "mongoose";


// USER DEPARTMENT
enum UserDepartment {
    COMPUTER_SCIENCE = "Computer Science",
    ENGLISH = "English",
    MATHS = "Mathematics",
    SCIENCE = "Science",
    SOCIAL_STUDIES = "Social Studies",
  }

// Define the interface for Department
interface IDepartment extends Document {
    facultyId: string;
    departmentId: string; // Unique identifier for the department
    name: UserDepartment;
    code: string; // Initials for the department
    userId: string; // Reference to the user who is associated with the department
    description: string
}

// Define the schema for Department
const departmentSchema: Schema<IDepartment> = new mongoose.Schema(
  {
    departmentId: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
        type: String,
        ref: "User",
        required: true
      },
      facultyId: {
        type: String,
        ref: "Faculty",
        require: true
      },
    name: {
      type: String,
      required: true,
      enum: Object.values(UserDepartment),
      default: UserDepartment.COMPUTER_SCIENCE
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: null,
    }
  },
  { timestamps: true }
);

// Create and export the Department model
export const Department: Model<IDepartment> = mongoose.model<IDepartment>("Department", departmentSchema);

