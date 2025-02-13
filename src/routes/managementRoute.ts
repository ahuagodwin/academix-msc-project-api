import express from 'express';
import * as management from "../controller/management.controller"
import { auditLogMiddleware } from '../middlewares/auditLog.md';
import { authenticate } from '../middlewares/authenticate.md';
import { accessControl } from '../middlewares/access_control';


const router = express.Router();

// Super Admin and Admin

router.post("/admin/create/management/", authenticate, accessControl(["super admin"], ["create"]), auditLogMiddleware({action: "create management user"}), management.addManagementUser)
router.get("/admin/managements/:schoolName/", authenticate, accessControl(["super admin"], ["read"]), auditLogMiddleware({action: "read management user"}), management.getAllManagements)
module.exports = router;