import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response } from "express";
import User from "../models/user.Model";
import asyncHandler from "express-async-handler";
import { loginSchema, signUpAdminUserSchema, signUpSchema } from "../middlewares/validator";
import { generateRefreshToken, generateToken } from "../config/token";
import { validateMongoDbId } from "../config/validateMongoId";
import { generateOTP, sendMail } from "../config/nodeMailler";
import Wallet from "../models/wallet.model";
import { Role } from "../models/roles.model";
import { generateInitials, generateRandomPassword } from "../utils/utils"
import { School } from "../models/school.model";
import { StorageSpace } from "../models/storage_space.model";


enum UserFileStorageSpace {
  BASIC_GB_5000 = "5000 GB",
  STANDARD_TB_1 = "1 TB",
  PREMIUM_TB_100 = "100 TB",
}

enum UserFileStorageSpaceName {
  BASIC = "Basic",
  STANDARD = "Standard",
  PREMIUM = "Premium",
}

enum UserPermissions {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

enum UserRole {
  LECTURER = "teacher", // teachers
  STUDENT = "student", // students
  SUPER_ADMIN = "super admin", // for dean, vc, and faculty officer
  ADMIN = "admin", // for staff of the faculty, dean and vc
  HOD = "head of department", //head of a department
  HOD_ADMIN = "administrator", // for staff of the faculty
}

// Create a new user
export const createUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { error, value } = signUpSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map((detail) => detail.message.replace(/"/g, ""));
      res.status(400).json({ error: validationErrors, status: false });
      return;
    }

    const { email, mobile, firstName, lastName, password, roleName, schoolName } = value;

    let newUser: any = null; // Storing reference to delete on failure

    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { mobile }, { schoolName }] });

      if (existingUser) {
        const conflictMessage =
          existingUser.email === email && existingUser.mobile === mobile && existingUser.schoolName === schoolName
            ? "User already exists with this email, phone number and school"
            : existingUser.email === email
            ? "User already exists with this email."
            :  existingUser.schoolName === schoolName 
            ? "User already exists with this school"
            : "User already exists with this phone number.";

        res.status(409).json({ error: conflictMessage, status: false });
        return;
      }

      // Generate a 6-digit OTP
      const otp = generateOTP();

      // Create the new user
      newUser = new User({
        email,
        mobile,
        firstName,
        lastName,
        password,
        emailVerified: false,
        emailVerificationCode: otp,
        emailVerificationCodeValidation: Date.now() + 10 * 60 * 1000,
      });

      await newUser.save();

      // Create and assign role
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = new Role({ name: roleName, user: newUser.id, permissions: [UserPermissions.CREATE, UserPermissions.READ, UserPermissions.UPDATE, UserPermissions.DELETE] });
        await role.save();
      }

      // Create or Assign School
      let school = await School.findOne({ name: schoolName });
      if (!school) {
        school = new School({ name: schoolName, userId: newUser.id, code: generateInitials(schoolName)});
        await school.save();
      }
      
      // Assign role, and school  to user
      newUser.role = role.roleId;
      newUser.schoolName = school.schoolId;
      await newUser.save();

      // Check if the user already has a wallet
      const existingWallet = await Wallet.findOne({ userId: newUser.id });

      if (!existingWallet) {
        const wallet = new Wallet({
          userId: newUser.id,
          balance: 0,
          currency: "NGN",
          userType: "User"
        });
        await wallet.save();

        // Update User with Wallet ID
        await User.findOneAndUpdate({id: newUser.id}, { wallet: wallet.walletId });
      }

      // checking if user already has a storage space
      const existingStorageSpace = await StorageSpace.findOne({ user: newUser.id });
      if (!existingStorageSpace) {
        const space = new StorageSpace({
          user: newUser.id,
          size: UserFileStorageSpace.BASIC_GB_5000,
          name: UserFileStorageSpaceName.BASIC
        });
        await space.save();

        // Update User with storageSpace ID
        await User.findOneAndUpdate({id: newUser.id}, { storage_space: space.storageSpaceId});
      }

      // Send the OTP email
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

      // Respond with success
      res.status(201).json({
        message: "Check your email for the OTP to complete registration.",
        status: true,
        email: email,
      });
    } catch (error) {
      console.error("Error creating user:", error);

      if (newUser) {
        console.log(`Deleting user ${newUser.email} due to an error.`);
        await User.findByIdAndDelete(newUser.id);
      }

      res.status(500).json({
        error: "Something went wrong while creating the user.",
        status: false,
      });
    }
  }
);

// Verify the OTP for email verification
export const verifyAccountCreation = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
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
      const user = await User.findOne({ email }).select("emailVerificationCode emailVerificationValidation");

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

      const validationTimestamp = Number(user.emailVerificationCodeValidation);
      // Check if the OTP is expired
      if (Date.now() > validationTimestamp) {
        res.status(400).json({
          error: "OTP has expired. Please request a new OTP.",
          status: false,
        });
        return;
      }

      // Update the user's verification status
      user.emailVerified = true;
      user.emailVerificationCode = null; // Clear the verification code
      user.emailVerificationCodeValidation = null; // Clear the expiration timestamp
      await user.save();

      res.status(200).json({
        message: "Account successfully verified. You can now log in.",
        status: true,
      });
    } catch (error) {
      console.error("Error verifying account:", error);
      res.status(500).json({
        error: "An internal server error occurred. Please try again later.",
        status: false,
      });
    }
  }
);

// request for new OTP
export const requestNewOTP = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: "Email is required to request a new OTP.",
        status: false,
      });
      return;
    }

    try {
      // Find the user with the provided email
      const user = await User.findOne({ email });

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
          error: "Account is already verified. You can proceed to login.",
          status: false,
        });
        return;
      }

      // Generate a new OTP
      const newOtp = generateOTP();
      const otpExpiration = Date.now() + 10 * 60 * 1000; // Valid for 10 minutes

      // Update the user's OTP and expiration time
      user.emailVerificationCode = newOtp;
      user.emailVerificationCodeValidation = String(otpExpiration);
      await user.save();

      // Send the new OTP via email
      const mailData = {
        to: user.email,
        subject: "Your New OTP",
        message: `Your new OTP is ${newOtp}.`,
        html: `<p>Your new OTP is <strong>${newOtp}</strong>. It is valid for 10 minutes.</p>`,
      };

      try {
        await sendMail(mailData);
      } catch (error) {
        res.status(500).json({
          error: "Failed to send OTP. Please try again later.",
          status: false,
        });
        return;
      }

      res.status(200).json({
        message: `A new OTP has been sent to ${email}. Please check your email.`,
        status: true,
      });
    } catch (error) {
      console.error("Error requesting new OTP:", error);
      res.status(500).json({
        error: "An internal server error occurred. Please try again later.",
        status: false,
      });
    }
  }
);


// Login user function
export const loginUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is empty.", status: false });
      return;
    }

  if (error) {
    const validationErrors = error.details.map((detail) => detail.message.replace(/"/g, ""));
    res.status(400).json({ error: validationErrors, status: false });
    return 
  }

  const { email, password } = value;

  // Check if the user exists
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res.status(404).json({ error: "User not found.", status: false });
    return 
  }

    if(user?.isBlocked) {
      res.status(403).json({ error: "Account is blocked. Please contact the administrator.", status: false });
      return;
    }

      // Check if the account is already verified
      if (!user.emailVerified) {
        // Generate a new OTP
        const otp = generateOTP();
        const otpExpiration = Date.now() + 10 * 60 * 1000; 
  
        // Update the user's OTP and expiration time
        user.emailVerificationCode = otp;
        user.emailVerificationCodeValidation = String(otpExpiration);
        await user.save();
  
        // Send the new OTP to user's email
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
          errorCode: "ACCOUNT_NOT_VERIFIED"
        });
        return;
      }

    // Verify password
    const isMatch = await user.isPasswordMatched(password);

    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password.", status: false });
      return;
    }

    // Generate a 6-digit OTP
    const otp = generateOTP();
    user.verificationCode = otp;
    user.verified = false;
    user.verificationCodeValidation = (Date.now() + 10 * 60 * 1000).toString(); // OTP valid for 10 minutes

    // Update the user's refresh token, OTP, and last login timestamp
    const refreshToken = generateRefreshToken(user?.id);
    await User.findByIdAndUpdate(
      user.id,
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
      secure: process.env.NODE_ENV === "production", // Set to true in production
      sameSite: "strict",
      maxAge: 72 * 60 * 60 * 1000, // 3 days
    });

    res.status(200).json({
      message: `Please enter the OTP sent to ${email} to proceed.`,
      status: true,
      email: email
    });
  }
);

// verify login OTP
export const verifyLoginOTP = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email }).select('verificationCode verificationCodeValidation');

    if (!user) {
      res.status(404).json({ error: "User not found.", status: false });
      return;
    }

    const validationTimestamp = Number(user.verificationCodeValidation);
    // Validate OTP
    if (
      user.verificationCode !== otp ||
      !user.verificationCodeValidation ||
      Date.now() > validationTimestamp // Ensure OTP is not expired
    ) {
      res.status(400).json({ error: "Invalid or expired OTP.", status: false });
      return;
    }

    // Update user as verified and clear OTP fields
    user.verified = true;
    user.verificationCode = null;
    user.verificationCodeValidation= null;

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update user's refresh token and save changes
    user.refreshToken = refreshToken;
    await user.save();

    // Set the refresh token as an HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production
      sameSite: "strict",
      maxAge: 72 * 60 * 60 * 1000, // 3 days
    });

    // Remove sensitive fields before sending the response
    const { password, verificationCode, verificationCodeValidation, _id, ...userWithoutSensitiveData } = user.toObject();

    res.status(200).json({
      message: "OTP verified successfully. User logged in.",
      status: true,
      user: userWithoutSensitiveData,
      accessToken,
    });
  }
);


// resend new login OTP
export const resendNewLoginOTP = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ error: "User not found.", status: false });
      return;
    }

    // Generate a new OTP
    const newOtp = generateOTP();
    const newOtpExpiration = (Date.now() + 10 * 60 * 1000).toString(); // OTP valid for 10 minutes

    // Update user with the new OTP and expiration time
    user.verificationCode = newOtp;
    user.verificationCodeValidation = newOtpExpiration;
    await user.save();

    // Send the new OTP to user's email
    const mailData = {
      to: user.email,
      subject: "Resend Login OTP",
      message: `Your new OTP for login is ${newOtp}.`,
      html: `<p>Your new OTP for login is <strong>${newOtp}</strong>. It is valid for 10 minutes.</p>`,
    };

    try {
      await sendMail(mailData);
    } catch (error) {
      res.status(500).json({ error: "Failed to resend OTP. Please try again later.", status: false });
      return;
    }

    res.status(200).json({
      message: `A new OTP has been sent to ${email}. Please check your email to proceed.`,
      status: true,
    });
  }
);


// Update user details
export const updateUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId, email, mobile, firstName, lastName } = req.body;

    validateMongoDbId(userId);
    // Checking if the user is updating their email or mobile
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found.", status: false });
      return;
    }

    const emailChanged = email && email !== user.email;
    const mobileChanged = mobile && mobile !== user.mobile;

    // Checking if email or mobile is being changed and already exists
    if (emailChanged) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        res
          .status(409)
          .json({
            error: "This email is already in use by another user.",
            status: false,
          });
        return;
      }
    }

    if (mobileChanged) {
      const existingMobileUser = await User.findOne({ mobile });
      if (existingMobileUser) {
        res
          .status(409)
          .json({
            error: "This mobile number is already in use by another user.",
            status: false,
          });
        return;
      }
    }

    // Update user details
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    await user.save();
    res
      .status(200)
      .json({ message: "User updated successfully.", status: true, user });
  }
);

// function for refresh token
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    // Get the refresh token from the cookies
    const refreshToken = req.cookies.refreshToken;

    // Check if the refresh token exists
    if (!refreshToken) {
      res
        .status(401)
        .json({ error: "No refresh token provided.", status: false });
      return;
    }

    try {
      // Verify the refresh token
      const decoded: any = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      );

      // Find the user associated with the refresh token
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401).json({ error: "User not found.", status: false });
        return;
      }

      // Check if the refresh token matches the one stored in the database
      if (user.refreshToken !== refreshToken) {
        res
          .status(401)
          .json({ error: "Invalid refresh token.", status: false });
        return;
      }

      // Generate a new access token and refresh token
      const accessToken = generateToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      // Save the new refresh token in the database
      user.refreshToken = newRefreshToken;
      await user.save();

      // Set the new refresh token in the HTTP-only cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure cookie in production
        maxAge: 72 * 60 * 60 * 1000, // 3 days
      });

      // Respond with the new access token and user data
      res.status(200).json({
        message: "Token refreshed successfully.",
        status: true,
        accessToken,
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid refresh token.", status: false });
    }
  }
);

// handle logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Get the refresh token from the cookies
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ message: "No refresh token found.", status: false });
    return;
  }

  try {
    // Decoding the refresh token to get user ID
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    );

    // Finding the user and reset the refresh token
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ message: "User not found.", status: false });
      return;
    }

    // Resetting the refresh token in the database
    user.refreshToken = "";
    user.verified = false
    await user.save();

    // Clearing the refresh token from the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Securing cookie in production
    });

    res.status(200).json({ message: "Logged out successfully.", status: true });
  } catch (error) {
    res.status(500).json({ message: "Logout failed.", status: false });
  }
});

// get all users
export const getAllUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Finding all users,
    const users = await User.find()
      .select("-_id -password -refreshToken") // Excluding _id and password from User
      .populate({
        path: "wallet",
        select: "-_id", // Exclude _id from Wallet
      });

    res.status(200).json({
      message: "Users fetched successfully.",
      status: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users.", status: false });
  }
});

// get single user
export const getSingleUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {      
      // Find the user by ID, excluding the password
      const user = await User.findOne({id}).select("-password -_id -refreshToken").populate({path: "wallet", select: "-_id"});
      if (!user) {
        res.status(404).json({ message: "User not found.", status: false });
        return;
      }

      res.status(200).json({
        message: "User fetched successfully.",
        status: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user.", status: false });
    }
  }
);

// Delete a user
export const deleteUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res
        .status(400)
        .json({
          error: "User ID is required to perform this operation.",
          status: false,
        });
      return;
    }

    validateMongoDbId(id);

    try {
      // Finding the user by ID and delete it
      const user = await User.findByIdAndDelete(id);

      // Checking if the user was found and deleted
      if (!user) {
        res.status(404).json({ error: "User not found.", status: false });
        return;
      }

      // Respond with a success message
      res.status(200).json({
        message: "User deleted successfully.",
        status: true,
      });
    } catch (error: any) {
      if (error.message.includes("Please this user is not found")) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        console.error(error);
        res
          .status(500)
          .json({
            success: false,
            error: "Something went wrong. Please try again later.",
          });
      }
    }
  }
);

// blocking and unblocking a user
export const blockAndUnblockUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Validating the userId format
    validateMongoDbId(id);

    try {
      // Finding the user by ID
      const user = await User.findById(id);

      // Checking if the user exists
      if (!user) {
        res.status(404).json({ error: "User not found.", status: false });
        return;
      }

      // Toggling the isBlocked property
      user.isBlocked = !user.isBlocked;

      // Saving the updated user
      await user.save();

      // Responding with a success message
      res.status(200).json({
        message: `User ${
          user.isBlocked ? "blocked" : "unblocked"
        } successfully.`,
        status: true,
      });
    } catch (error) {
      // Catch server errors and send a 500 status code
      console.error(error);
      res
        .status(500)
        .json({
          error: "Something went wrong. Please try again later.",
          status: false,
        });
    }
  }
);

// update user password
export const updateUserPassword = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Validate the userId format
    validateMongoDbId(userId);

    try {
      // Find the user by ID
      const user = await User.findById(userId);

      // Check if the user exists
      if (!user) {
        res.status(404).json({ error: "User not found.", status: false });
        return;
      }

      // Check if the old password matches the stored password
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordMatch) {
        res
          .status(401)
          .json({ error: "Old password is incorrect.", status: false });
        return;
      }

      // Update the user's password
      user.password = newPassword;

      // Save the updated user
      await user.save();

      // Respond with a success message
      res.status(200).json({
        message: "Password updated successfully.",
        status: true,
      });
    } catch (error) {
      // Catch server errors and send a 500 status code
      console.error(error); // Optional: Log the error for debugging
      res
        .status(500)
        .json({
          error: "Something went wrong. Please try again later.",
          status: false,
        });
    }
  }
);

// forgot password request function
export const forgotPasswordRequest = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

     // Validate email format if needed
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Invalid email address.', status: false });
    return;
  }

    const user = await User.findOne({ email });
    if (!user) {
      res
        .status(404)
        .json({
          error: "User not found with this email address.",
          status: false,
        });
      return;
    }

    try {
      const token = await user.createPasswordResetToken();
      await user.save();

      const resetUrl = `<a href='${process.env.LOCALHOST_URL}/reset/password/${token}/${email}'>Click Here</a>`;
      const data = {
        from: process.env.MAIL_USER,
        to: `${email}`,
        subject: "Password Reset Request",
        html: `Hi, please click on the link below to reset your password ${resetUrl}`,
      };
      await sendMail(data);

      res.json({ message: `Password reset link has been sent to ${email}. please check your inbox or spam folder`, });;
    } catch (err: any) {
      throw new Error(err);
    }
  }
);


// reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  const { token } = req.params;

   // Hash the incoming token
   const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({ error: "Invalid or expired token.", status: false });
    return;
  }

  // Update user password and clear reset token fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Generate and save a new 6-digit OTP for verification
  const otp = generateOTP();
  user.forgotPasswordCode = otp;
  user.forgotPasswordCodeValidation = (Date.now() + 30 * 60 * 1000).toString();
  await user.save();

  // Prepare email data
  const mailData = {
    to: user.email,
    subject: "OTP Verification Code",
    message: `Your OTP for verification is ${otp}.`,
    html: `<p>Your OTP for verification is <strong>${otp}</strong>.</p>`,
  };

  try {
    // Send OTP to the user's email
    await sendMail(mailData);

    res.json({
      message: "An OTP has been sent to your email address for verification.",
      status: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP. Please try again later.", status: false });
  }
});

// verify reset password otp
export const verifyResetPasswordOTP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { otp, email } = req.body;

  if (!otp || !email) {
    res.status(400).json({ error: "OTP and email are required.", status: false });
    return 
  }

  // Find the user by email
  const user = await User.findOne({ email }).select('forgotPasswordCode forgotPasswordCodeValidation');

  if (!user) {
    res.status(404).json({ error: "User not found.", status: false });
    return 
  }

  // Ensure that the OTP exists and is still valid
  if (!user.forgotPasswordCode || !user.forgotPasswordCodeValidation) {
    res.status(400).json({ error: "OTP or validation time is missing.", status: false });
    return
  }

  const validateTimeStamp = Number(user.forgotPasswordCodeValidation)

  // Check if OTP has expired
  if (validateTimeStamp < Date.now()) {
    res.status(400).json({ error: "Invalid or OTP has expired.", status: false });
    return
  }

  // Verify if the OTP matches
  if (user.forgotPasswordCode !== otp) {
    res.status(400).json({ error: "Incorrect OTP. Please enter a valid OTP", status: false });
    return 
  }

  // Clear OTP fields after successful verification
  user.forgotPasswordCode = null; // Clear OTP
  user.forgotPasswordCodeValidation = null; // Clear expiration
  await user.save();

  res.json({ message: "OTP verification successful.", status: true });
});


// update user role
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params; 
    const { role } = req.body; 

    // Validate the role
    const validRoles = ["client", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        error: "Invalid role",
        status: false,
      });
      return;
    }

    // Validate the user ID
    validateMongoDbId(id);

    try {
      // Find the user by ID
      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          error: "User not found.",
          status: false,
        });
        return;
      }

      // Update the user's role
      user.role = role;
      await user.save();

      res.status(200).json({
        message: `User role updated successfully to ${role}.`,
        status: true,
        user: {
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({
        error: "An error occurred. Please try again later.",
        status: false,
      });
    }
  }
);



export default {
  createUser,
  loginUser,
  updateUser,
  refreshToken,
  logout,
  getAllUser,
  getSingleUser,
  deleteUser,
  blockAndUnblockUser,
  updateUserPassword,
  forgotPasswordRequest,
  resetPassword,
  verifyResetPasswordOTP,
  verifyLoginOTP,
  verifyAccountCreation,
  requestNewOTP,
  resendNewLoginOTP,
  updateUserRole
};
