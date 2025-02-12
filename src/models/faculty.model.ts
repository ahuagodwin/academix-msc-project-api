import mongoose, { Model, Schema } from "mongoose";


enum UserFaculty {
    ICT = "Information and Communication Technology",
    ARTS = "Arts",
    SCIENCES = "Science",
    LAW = "Law",
    BUSINESS = "Business",
    ENGINEERING = "Engineering",
    HEALTH_AND_BEHAVIOR = "Health and Behavior",
    CMS = "Applied and Natural Science"
  }
// Define the interface for Faculty
interface IFaculty extends Document {
    facultyId: string; // Unique identifier for the faculty
    name: UserFaculty;
    userId: string; // Referencing to the user associated with the faculty
  }
  
  // Defining the schema for Faculty
  const facultySchema: Schema<IFaculty> = new mongoose.Schema(
    {
        facultyId: {
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
        enum: Object.values(UserFaculty),
        default: UserFaculty.ICT
      },
    },
    { timestamps: true }
  );
  
  // Create and export the Faculty model
  export const Faculty: Model<IFaculty> = mongoose.model<IFaculty>("Faculty", facultySchema);
  