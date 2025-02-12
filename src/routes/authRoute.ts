import express from 'express';
import userController from "../controller/userController"
import auditLogController from "../controller/auditLog.controller"
import * as accessController from "../controller/control.controller"
import { auditLogMiddleware } from '../middlewares/auditLog.md';
import { authenticate } from '../middlewares/authenticate.md';
import { accessControl } from '../middlewares/access_control';


const router = express.Router();


// client route
router.post("/user/auth/register/", auditLogMiddleware({action: "register"}), userController.createUser);
router.post("/user/auth/register/verify", auditLogMiddleware({action: "verify account"}), userController.verifyAccountCreation)
router.post("/user/auth/register/resend-otp/", auditLogMiddleware({action: "resend register otp"}), userController.requestNewOTP)
router.post("/user/auth/login/", auditLogMiddleware({action: "login"}), userController.loginUser)
router.post("/user/auth/login/verify/", auditLogMiddleware({action: "verify login"}), userController.verifyLoginOTP)
router.post("/user/auth/login/resend-otp/", auditLogMiddleware({action: "resend login otp"}), userController.resendNewLoginOTP)
router.post("/user/auth/logout/", auditLogMiddleware({action: "logout"}), userController.logout)
router.post("/user/auth/forgot-password/", auditLogMiddleware({action: "forgot password"}), userController.forgotPasswordRequest)
router.post("/user/auth/reset-password/:token/", auditLogMiddleware({action: "reset password"}), userController.resetPassword)
router.post("/user/auth/reset-password-verify/", auditLogMiddleware({action: "reset password verify"}), userController.verifyResetPasswordOTP)
router.post("/user/client/refreshToken/", authenticate, auditLogMiddleware({action: "refresh token"}), userController.refreshToken)
router.get("/user/client/all-users/",  authenticate, accessControl(["admin", 'student'], ["read"]), auditLogMiddleware({action: "display all users"}), userController.getAllUser)
router.get(`/user/client/user/:id/`,  authenticate, auditLogMiddleware({action: "get a user record"}), userController.getSingleUser)
router.delete("/user/client/delete-user/:id/", authenticate, authenticate, auditLogMiddleware({action: "delete user"}), userController.deleteUser)
router.patch("/user/client/update-user/", authenticate, auditLogMiddleware({action: "update user record"}), userController.updateUser)
router.patch("/user/client/update-password/", authenticate, auditLogMiddleware({action: "update password"}), userController.updateUserPassword)
router.post("/user/client/block-unblock/:id/", authenticate, auditLogMiddleware({action: "block user"}), userController.blockAndUnblockUser)
router.patch("/user/client/update-role/:id/", authenticate, auditLogMiddleware({action: "update role"}), userController.updateUserRole)


// admin routes 
router.post("/console/admin/auth/login/", auditLogMiddleware({action: "admin login"}), userController.loginUser)
router.get("/console/admin/audit-logs/", authenticate, auditLogMiddleware({action: "all audit logs"}), auditLogController.getAuditLogs)
router.put("/admin/client/role/:userId/", authenticate, accessControl(["super admin"], ["write"]), auditLogMiddleware({action: "update role"}), accessController.updateUserRoleAndPermissions)

module.exports = router;