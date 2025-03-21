import { IRoute } from "../types/types";
import mongoose, { Schema, Model } from "mongoose";

// Define the schema for routes
const routesSchema: Schema<IRoute> = new Schema(
  {
    name: { type: String, required: true },
    path: { type: String, required: true },
  },
  { timestamps: true }
);

// Create the Route model
const Routes: Model<IRoute> = mongoose.model<IRoute>("Routes", routesSchema);

export default Routes;
