import express from 'express';
import * as faculty from "../controller/faculty.controller"
import { auditLogMiddleware } from '../middlewares/auditLog.md';
import { authenticate } from '../middlewares/authenticate.md';
import { accessControl } from '../middlewares/access_control';


const router = express.Router();

// Super Admin and Admin

router.post("/admin/create/faculty", authenticate, accessControl(["super admin", "admin"], ["create"]), auditLogMiddleware({action: "create faculty"}), faculty.createFaculty)
router.get("/admin/faculties/", authenticate, accessControl(["super admin", "admin"], ["read"]), auditLogMiddleware({action: "get all faculty"}), faculty.getAllFaculties)
router.put("/admin/faculty/:facultyId/update/", authenticate, accessControl(["super admin", "admin"], ["update"]), auditLogMiddleware({action: "update faculty"}), faculty.updateFaculty)
router.delete("/admin/faculty/:facultyId/delete/", authenticate, accessControl(["super admin"], ["delete"]), auditLogMiddleware({action: "delete faculty"}), faculty.deleteFaculty)

module.exports = router;