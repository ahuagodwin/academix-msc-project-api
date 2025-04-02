"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolRouter = void 0;
const express_1 = require("express");
const authorized_md_1 = require("../middlewares/authorized.md");
const schoolService = __importStar(require("../controller/school.controller"));
const schoolRouter = (0, express_1.Router)();
exports.schoolRouter = schoolRouter;
schoolRouter.post("/create/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_school"), schoolService.createSchool);
schoolRouter.put("/update/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_school"), schoolService.updateSchool);
schoolRouter.delete("/delete/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_school"), schoolService.deleteSchool);
schoolRouter.get("/all", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getAllSchools);
schoolRouter.get("/:schoolId", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getSchoolById);
schoolRouter.post("/faculty/create/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_school"), schoolService.createFaculty);
schoolRouter.put("/faculty/update/:schoolId/:facultyId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_school"), schoolService.updateFaculty);
schoolRouter.delete("/faculty/delete/:schoolId/:facultyId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_school"), schoolService.deleteFaculty);
schoolRouter.get("/faculty/all/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getAllFaculties);
schoolRouter.get("/faculty/:schoolId/:facultyId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getFacultyById);
schoolRouter.post("/department/create/:schoolId/:facultyId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_school"), schoolService.createDepartments);
schoolRouter.put("/department/update/:schoolId/:facultyId/:departmentId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_school"), schoolService.updateDepartment);
schoolRouter.delete("/department/delete/:schoolId/:facultyId/:departmentId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_school"), schoolService.deleteDepartment);
schoolRouter.get("/department/all/:schoolId/:facultyId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getAllDepartments);
schoolRouter.get("/department/:schoolId/:facultyId/:departmentId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getDepartmentById);
schoolRouter.post("/course/create/:schoolId/:facultyId/:departmentId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_school"), schoolService.createCourses);
schoolRouter.put("/course/update/:schoolId/:facultyId/:departmentId/:courseId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_school"), schoolService.updateCourse);
schoolRouter.delete("/course/delete/:schoolId/:facultyId/:departmentId/:courseId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_school"), schoolService.deleteCourse);
schoolRouter.get("/course/all/:schoolId/:facultyId/:departmentId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getAllCourses);
schoolRouter.get("/course/:schoolId/:facultyId/:departmentId/:courseId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_school"), schoolService.getCourseById);
