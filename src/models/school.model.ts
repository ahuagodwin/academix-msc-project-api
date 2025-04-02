
import { ISchool } from "../types/types";
import mongoose, { Schema, Model, model, Types } from "mongoose";


const facultySchema = new Schema(
  {
    name: { type: String, required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, },
    departments: [
      {
        name: { type: String, required: true },
        courses: [{ name: { type: String, required: true } }],
      },
    ],
  },
);

const schoolSchema = new Schema<ISchool>(
    {
        name: { type: String, required: true, unique: true },
        faculties: [facultySchema],
        schoolId: { type: mongoose.Schema.Types.ObjectId },
        code: { type: String },
      },
    { timestamps: true }
);


schoolSchema.pre("save", function (this: Document & ISchool, next) {
  if (!this.schoolId) {
    this.schoolId = this._id as Types.ObjectId; 
  }
  next();
});

schoolSchema.pre("validate", function (next) {
  if (this.faculties) {
    this.faculties.forEach(faculty => {
      if (!faculty.facultyId) {
        faculty.facultyId = new Types.ObjectId;
      }
    });
  }
  next();
});



const School: Model<any> = model("School", schoolSchema);
export default School;

