import { authorize, authProtect } from "../middlewares/authorized.md";
import * as roleService from "../controller/role.controller";
import { Router } from "express";

const roleRouter = Router();

// AUTHENTICATION routes
roleRouter.post("/create/", authProtect, authorize("create_role"), roleService.createRole);
roleRouter.put("/update/:roleId/", authProtect, authorize("update_role"), roleService.updateRoleById);
roleRouter.delete("/delete/:roleId/", authProtect, authorize("delete_role"), roleService.deleteRoleById);
roleRouter.get("/all", authProtect, authorize("read_role"), roleService.getAllRoles);
roleRouter.get("/:roleId", authProtect, authorize("read_role"), roleService.getRoleById);
roleRouter.post("/assign/", authProtect, authorize("create_role"), roleService.assignRolesToUser);
roleRouter.put("/assign/update/", authProtect, authorize("update_role"), roleService.updateAssignedRolesToUser)
roleRouter.get("/assign/all/roles/", authProtect, authorize("read_role"), roleService.getAllUsersWithRoles)

export { roleRouter };
