import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import School from "../models/school.model";
import Wallet from "../models/wallet.model";
import { generateOTP, generateRefreshToken, generateToken, permissions } from "../helpers/Helpers";
import { sendMail } from "../email/nodemailer";
import Role from "../models/role.model";
import { loginSchema } from "../schema/Schema";
import { ISchool, UserType } from "../types/types";

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
      const { firstName, lastName, email, password, phoneNumber, school, faculty, department, user_type } = req.body;

      if (!firstName || !lastName || !email || !password || !phoneNumber || !user_type) {
          throw new Error("All fields are required");
      }

      // Validate school existence (for CLIENT and TEACHER)
      let schoolDoc;
      if (user_type === UserType.CLIENT || user_type === UserType.TEACHER) {
          if (!school) throw new Error("School is required.");

          schoolDoc = await School.findById(school);
          if (!schoolDoc) throw new Error("Invalid school ID.");
      }

      // Additional validation for CLIENT and TEACHER (faculty and department)
      if (user_type === UserType.CLIENT || user_type === UserType.TEACHER) {
          if (!faculty || !department) {
              throw new Error("Faculty and department are required for clients.");
          }

          // Validate if faculty exists in the school
          const facultyExists = schoolDoc?.faculties.some((fac: any) => fac.facultyId.toString() === faculty);
          if (!facultyExists) throw new Error("Invalid faculty ID for the selected school.");

          // Validate if department exists in the faculty
          const facultyDoc = schoolDoc?.faculties.find((fac: any) => fac.facultyId.toString() === faculty);
          const departmentExists = facultyDoc?.departments.some((dept: ISchool) => dept.id.toString() === department);
          if (!departmentExists) throw new Error("Invalid department ID for the selected faculty.");
      }

      const existingUser = await User.findOne({
          $or: [{ email }, { phoneNumber }],
      });

      if (existingUser) {
          const conflictMessage =
              existingUser?.email === email && existingUser?.phoneNumber === phoneNumber
                  ? "User already exists with this email and phone number."
                  : existingUser?.email === email
                  ? "User already exists with this email."
                  : "User already exists with this phone number.";

          res.status(409).json({ error: conflictMessage, status: false });
          return;
      }

      // Start Transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      const defaultRoleName =
          user_type === UserType.CLIENT ? "Student" :
          user_type === UserType.TEACHER ? "Teacher" :
          "System Owner";

      let defaultRole = await Role.findOne({ name: defaultRoleName }).session(session);
      if (!defaultRole) {
          defaultRole = new Role({
              name: defaultRoleName,
              description: `Default ${defaultRoleName} role`,
              roleId: new mongoose.Types.ObjectId(),
              permissions: defaultRoleName === "System Owner" ? permissions.owner :
                           defaultRoleName === "Teacher" ? permissions.teacher :
                           permissions.student,
              routes: [],
          });

          await defaultRole.save({ session });
      }

      if (!defaultRole) {
          throw new Error(`Default role "${defaultRoleName}" not found.`);
      }

      try {
          // Generate OTP
          const otp = generateOTP();

          // Create new User
          const newUser = new User({
              email,
              phoneNumber,
              firstName,
              lastName,
              password,
              user_type,
              school: user_type !== UserType.OWNER ? schoolDoc?._id : undefined,
              faculty: user_type !== UserType.OWNER ? faculty : undefined,
              department: user_type !== UserType.OWNER ? department : undefined,
              emailVerified: false,
              emailVerificationCode: otp,
              emailVerificationCodeValidation: Date.now() + 10 * 60 * 1000,
              roles: [defaultRole._id],
          });

          await newUser.save({ session });

          // Create Wallet and Link it to the User
          const wallet = new Wallet({
              userId: newUser._id,
              balance: 0,
              currency: "NGN",
          });

          await wallet.save({ session });

          await User.findByIdAndUpdate(newUser._id, { wallet: wallet._id }, { session });

          // Commit Transaction
          await session.commitTransaction();
          session.endSession();

          // Send OTP Email
          const mailData = {
              to: email,
              subject: "Email Verification for Account Registration",
              html: `<p>Your OTP for email verification is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
          };

          try {
              await sendMail(mailData);
          } catch (mailError) {
              console.error("Error sending OTP email:", mailError);
              throw new Error("Failed to send email verification OTP. Please try again later.");
          }

          // Success Response
          res.status(201).json({
              success: true,
              message: "Check your email for the OTP to complete registration.",
              email: email,
              school: user_type !== UserType.OWNER ? schoolDoc?.name : undefined,
          });

      } catch (error: any) {
          await session.abortTransaction();
          session.endSession();

          if (error.code === 11000) {
              console.error("Duplicate Key Error:", error);
              res.status(409).json({
                  success: false,
                  message: "Duplicate field value entered. Email or phone number already exists.",
              });
          } else {
              next(error);
          }
      }
  } catch (err) {
      next(err);
  }
});



// Verify the OTP for email verification
export const verifyAccountCreation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { email, otp } = req.body;
  
      if (!email || !otp) {
        res.status(400).json({
          error: "Email and OTP are required for verification.",
          status: false,
        });
        return;
      }
  
      try {
        // Find the user with the provided email
        const user = await User.findOne({ email }).select("emailVerificationCode emailVerificationCodeValidation");
  
        if (!user) {
          res.status(404).json({
            error: "User not found. Please check the email provided.",
            status: false,
          });
          return;
        }
  
        // Check if the account is already verified
        if (user.emailVerified) {
          res.status(400).json({
            error: "Account is already verified. Please proceed to login",
            status: false,
          });
          return;
        }
  
        // Verify the OTP
        if (user.emailVerificationCode !== otp) {
          res.status(400).json({
            error: "Invalid OTP. Please check and try again.",
            status: false,
          });
          return;
        }

        const otpExpiration = user.emailVerificationCodeValidation
        ? Number(user.emailVerificationCodeValidation)
        : null;
      
      if (!otpExpiration || Date.now() > otpExpiration) {
        res.status(400).json({
          error: "OTP has expired. Please request a new OTP.",
          status: false,
        });
        return;
      }

  
        // Update the user's verification status
        user.emailVerified = true;
        user.emailVerificationCode = null; 
        user.emailVerificationCodeValidation = null;
        await user.save();
  
        res.status(200).json({
          message: "Account successfully verified. You can now log in.",
          status: true,
        });
      } catch (error) {
        next(error);
        console.error("Error verifying account:", error);
        res.status(500).json({
          error: "An internal server error occurred. Please try again later.",
          status: false,
        });
      }
    }
  );

  // login
  export const loginUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is empty.", status: false });
      return;
    }
  
    if (error) {
      const validationErrors = error.details.map((detail) => detail.message.replace(/"/g, ""));
      res.status(400).json({ error: validationErrors, status: false });
      return;
    }
  
    const { email, password } = value;
  
    // Check if the user exists
    const user = await User.findOne({ email }).select("+password");
  
    if (!user) {
      res.status(404).json({ error: "User not found.", status: false });
      return;
    }
  
    if (user.isBlocked) {
      res.status(403).json({ error: "Account is blocked. Please contact the administrator.", status: false });
      return;
    }
  
    // Check if the account is verified
    if (!user.emailVerified) {
      // Generate a new OTP
      const otp = generateOTP();
      const otpExpiration = Date.now() + 10 * 60 * 1000; 
  
      // Store OTP and expiration as strings
      user.emailVerificationCode = otp.toString();
      user.emailVerificationCodeValidation = otpExpiration.toString();
      await user.save();
  
      // Send OTP to user's email
      const mailData = {
        to: user.email,
        subject: "Verify Your Account",
        message: `Your OTP for email verification is ${otp}.`,
        html: `<p>Your OTP for email verification is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
      };
  
      try {
        await sendMail(mailData);
      } catch (error) {
        res.status(500).json({ error: "Failed to send OTP. Please try again later.", status: false });
        return;
      }
  
      res.status(400).json({
        error: "Account is not verified. A new OTP has been sent to your email. Please verify your email to proceed.",
        status: false,
      });
      return;
    }
  
    // Verify password
    const isMatch = await user.isPasswordMatched(password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password.", status: false });
      return;
    }
  
    // Generate a 6-digit OTP for login
    const otp = generateOTP();
    const otpExpiration = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
  
    // Store OTP and expiration
    user.verificationCode = otp;
    user.verified = false;
    user.verificationCodeValidation = otpExpiration.toString();
  
    // Update user data
    const refreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(
      user?._id,
      {
        refreshToken,
        verificationCode: otp,
        verificationCodeValidation: user.verificationCodeValidation,
        lastLogin: new Date(),
      },
      { new: true }
    );
  
    // Send OTP to user's email
    const mailData = {
      to: user.email,
      subject: "Your Login OTP",
      message: `Your OTP for login is ${otp}.`,
      html: `<p>Your OTP for login is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    };
  
    try {
      await sendMail(mailData);
    } catch (error) {
      res.status(500).json({ error: "Failed to send OTP. Please try again later.", status: false });
      return;
    }
  
    // Set the refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false, 
      sameSite: "strict",
      maxAge: 72 * 60 * 60 * 1000, // 3 days
    });
  
    res.status(200).json({
      message: `Please enter the OTP sent to ${email} to proceed.`,
      status: true,
      email: email,
    });
  });

  // verify login OTP
export const verifyLoginOTP = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email }).select("verificationCode verificationCodeValidation refreshToken").lean();

    if (!user) {
      res.status(404).json({ error: "User not found.", status: false });
      return;
    }

    // Validate OTP
    if (
      !user.verificationCodeValidation ||
      user.verificationCode !== otp ||
      Date.now() > new Date(user.verificationCodeValidation).getTime()
    ) {
      res.status(400).json({ error: "Invalid or expired OTP.", status: false });
      return;
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Update user as verified and clear OTP fields
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: { verified: true, refreshToken },
        $unset: { verificationCode: 1, verificationCodeValidation: 1 },
      },
      { new: true }
    );

    // Set the refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production
      sameSite: "strict",
      maxAge: 72 * 60 * 60 * 1000, // 3 days
    });

    // Remove sensitive fields before sending the response
    const { password, verificationCode, verificationCodeValidation, refreshToken: _, ...userWithoutSensitiveData } = user;

    res.status(200).json({
      message: "OTP verified successfully. User logged in.",
      status: true,
      user: userWithoutSensitiveData,
      accessToken,
    });
  }
);

  