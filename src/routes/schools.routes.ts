import { Router } from "express"
import { authorize, authProtect } from "../middlewares/authorized.md";
import * as schoolService from "../controller/school.controller";

const schoolRouter = Router();

schoolRouter.post("/create/", authProtect, authorize("create_school"), schoolService.createSchool);
schoolRouter.put("/update/:schoolId/", authProtect, authorize("update_school"), schoolService.updateSchool)
schoolRouter.delete("/delete/:schoolId/", authProtect, authorize("delete_school"), schoolService.deleteSchool)
schoolRouter.get("/all", authProtect, authorize("read_school",), schoolService.getAllSchools);
schoolRouter.get("/:schoolId", authProtect, authorize("read_school",), schoolService.getSchoolById);

schoolRouter.post("/faculty/create/:schoolId/", authProtect, authorize("create_school"), schoolService.createFaculty);
schoolRouter.put("/faculty/update/:schoolId/:facultyId/", authProtect, authorize("update_school"), schoolService.updateFaculty)
schoolRouter.delete("/faculty/delete/:schoolId/:facultyId/", authProtect, authorize("delete_school"), schoolService.deleteFaculty)
schoolRouter.get("/faculty/all/:schoolId/", authProtect, authorize("read_school",), schoolService.getAllFaculties);
schoolRouter.get("/faculty/:schoolId/:facultyId/", authProtect, authorize("read_school",), schoolService.getFacultyById);

schoolRouter.post("/department/create/:schoolId/:facultyId/", authProtect, authorize("create_school"), schoolService.createDepartments)
schoolRouter.put("/department/update/:schoolId/:facultyId/:departmentId/", authProtect, authorize("update_school"), schoolService.updateDepartment)
schoolRouter.delete("/department/delete/:schoolId/:facultyId/:departmentId/", authProtect, authorize("delete_school"), schoolService.deleteDepartment)
schoolRouter.get("/department/all/:schoolId/:facultyId/", authProtect, authorize("read_school",), schoolService.getAllDepartments);
schoolRouter.get("/department/:schoolId/:facultyId/:departmentId/", authProtect, authorize("read_school"), schoolService.getDepartmentById);

schoolRouter.post("/course/create/:schoolId/:facultyId/:departmentId/", authProtect, authorize("create_school"), schoolService.createCourses)
schoolRouter.put("/course/update/:schoolId/:facultyId/:departmentId/:courseId/", authProtect, authorize("update_school"), schoolService.updateCourse)
schoolRouter.delete("/course/delete/:schoolId/:facultyId/:departmentId/:courseId/", authProtect, authorize("delete_school"), schoolService.deleteCourse)
schoolRouter.get("/course/all/:schoolId/:facultyId/:departmentId/", authProtect, authorize("read_school"), schoolService.getAllCourses);
schoolRouter.get("/course/:schoolId/:facultyId/:departmentId/:courseId/", authProtect, authorize("read_school"), schoolService.getCourseById);

export { schoolRouter };