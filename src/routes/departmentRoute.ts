import express from 'express';
import * as department from "../controller/department.controller"
import { auditLogMiddleware } from '../middlewares/auditLog.md';
import { authenticate } from '../middlewares/authenticate.md';
import { accessControl } from '../middlewares/access_control';


const router = express.Router();

// Super Admin and Admin

router.post("/admin/create/department", authenticate, accessControl(["super admin", "admin"], ["create"]), auditLogMiddleware({action: "create department"}), department.createDepartment)
router.get("/admin/departments/", authenticate, accessControl(["super admin", "admin"], ["read"]), auditLogMiddleware({action: "get all faculty"}), department.getAllDepartments)
router.put("/admin/department/:departmentId/update/", authenticate, accessControl(["super admin", "admin"], ["update"]), auditLogMiddleware({action: "update department"}), department.updateDepartment)
router.delete("/admin/department/:departmentId/delete/", authenticate, accessControl(["super admin"], ["delete"]), auditLogMiddleware({action: "delete department"}), department.deleteDepartment)
router.get("/admin/department/:departmentId/", authenticate, accessControl(["super admin"], ["read"]), auditLogMiddleware({action: "get single department"}), department.getDepartmentById)

module.exports = router;