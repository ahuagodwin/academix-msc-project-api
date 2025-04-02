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
exports.teacherRouter = void 0;
const authorized_md_1 = require("../middlewares/authorized.md");
const teacherService = __importStar(require("../controller/teacher.controller"));
const express_1 = require("express");
const teacherRouter = (0, express_1.Router)();
exports.teacherRouter = teacherRouter;
// AUTHENTICATION routes
teacherRouter.post("/assign-course/:teacherId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_teacher"), teacherService.assignTeacher);
teacherRouter.put("/update-assigned-course/:teacherId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_teacher"), teacherService.updateAssignedTeacher);
teacherRouter.delete("/delete-assigned-course/:teacherId/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_teacher"), teacherService.deleteAssignedTeacher);
teacherRouter.get("/all/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_teacher"), teacherService.getAllAssignedTeachers);
teacherRouter.get("/:teacherId/:schoolId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_teacher"), teacherService.getAllAssignedTeachersById);
