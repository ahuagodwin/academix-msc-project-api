
import * as jwt from "jsonwebtoken"
import { getEnvVariable } from "../utils/utils";
import { Types } from "mongoose";
import ms from 'ms'; 

// export const generateRefreshToken = (id: string | Types.ObjectId) => {
//     const secret = getEnvVariable("JWT_SECRET_KEY")
//     return jwt.sign({id}, secret, {expiresIn:  process.env.JWT_REFRESH_EXPIRATION || "10d"})
// }

export const generateRefreshToken= (id: string | Types.ObjectId) => {
    const secret = getEnvVariable("JWT_SECRET_KEY");
  
    if (typeof secret !== 'string') {
      throw new Error("JWT_SECRET_KEY must be a valid string.");
    }
  
    // Ensure expiresIn is a valid string or number
    const expiresIn: any= process.env.JWT_REFRESH_EXPIRATION || "10d";  // Default fallback
  
    // Parse expiresIn using ms library (converts to number of milliseconds)
    const parsedExpiresIn = ms(expiresIn);
  
    if (typeof parsedExpiresIn !== 'number') {
      throw new Error(`Invalid duration string for JWT_ACCESS_EXPIRATION: ${expiresIn}`);
    }
  
    // Sign the JWT token with parsedExpiresIn as number
    return jwt.sign({ id }, secret, { expiresIn: parsedExpiresIn });
  };


// export const generateToken = (id: string | Types.ObjectId) => {
//     const secret = getEnvVariable("JWT_SECRET_KEY")
//     return jwt.sign({id}, secret, {expiresIn:  process.env.JWT_ACCESS_EXPIRATION || "10d"})
// }

export const generateToken = (id: string | Types.ObjectId) => {
    const secret = getEnvVariable("JWT_SECRET_KEY");
  
    if (typeof secret !== 'string') {
      throw new Error("JWT_SECRET_KEY must be a valid string.");
    }
  
    // Ensure expiresIn is a valid string or number
    const expiresIn: any = process.env.JWT_ACCESS_EXPIRATION || "10d";  // Default fallback
  
    // Parse expiresIn using ms library (converts to number of milliseconds)
    const parsedExpiresIn = ms(expiresIn);
  
    if (typeof parsedExpiresIn !== 'number') {
      throw new Error(`Invalid duration string for JWT_ACCESS_EXPIRATION: ${expiresIn}`);
    }
  
    // Sign the JWT token with parsedExpiresIn as number
    return jwt.sign({ id }, secret, { expiresIn: parsedExpiresIn });
  };

