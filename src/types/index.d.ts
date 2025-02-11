import { Document } from "mongoose";
import "express";

declare global {
  namespace NodeJS {
      interface ProcessEnv {
          JWT_SECRET_KEY: string;
      }
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser; 
    }
  }
}