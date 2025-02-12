import mongoose, { Model, Schema } from "mongoose";


enum UserSchool {
    IAU = "Ignatius Ajuru University",
    RSU = "Rivers State University",
    UNIPORT = "University of Port Harcourt",
  }
// Define the interface for School
interface ISchool extends Document {
    schoolId: string; // Unique identifier for the School
    name: UserSchool;
    userId: string; // Referencing to the user associated with the School
    code: string // school abbreviation
  }
  
  // Defining the schema for School
  const SchoolSchema: Schema<ISchool> = new mongoose.Schema(
    {
        schoolId: {
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
      name: {
        type: String,
        required: true,
        unique: true,
        enum: Object.values(UserSchool),
        default: UserSchool.IAU
      },
      code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
      },
    },
    { timestamps: true }
  );
  
  // Create and export the School model
  export const School: Model<ISchool> = mongoose.model<ISchool>("School", SchoolSchema);
  