import { authorize, authProtect } from "../middlewares/authorized.md";
import * as teacherService from "../controller/teacher.controller";
import { Router } from "express";

const teacherRouter = Router();

// AUTHENTICATION routes
teacherRouter.post("/assign-course/:teacherId/", authProtect, authorize("create_teacher"), teacherService.assignTeacher);
teacherRouter.put("/update-assigned-course/:teacherId/", authProtect, authorize("update_teacher"), teacherService.updateAssignedTeacher);
teacherRouter.delete("/delete-assigned-course/:teacherId/:schoolId/", authProtect, authorize("delete_teacher"), teacherService.deleteAssignedTeacher);
teacherRouter.get("/all/:schoolId/", authProtect, authorize("read_teacher"), teacherService.getAllAssignedTeachers);
teacherRouter.get("/:teacherId/:schoolId/", authProtect, authorize("read_teacher"), teacherService.getAllAssignedTeachersById);

export { teacherRouter };
