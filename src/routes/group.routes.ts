import { authorize, authProtect } from "../middlewares/authorized.md";
import * as groupService from "../controller/group.controller";
import { Router } from "express";

const groupRouter = Router();

groupRouter.post("/create/", authProtect, groupService.createGroup);
groupRouter.put("/update/:groupId/", authProtect, groupService.updateGroup);
groupRouter.post("/add-user-to-group/:groupId/", authProtect, groupService.addUsersToGroup);
groupRouter.delete("/delete/:groupId/", authProtect, authorize("delete_group"), groupService.deleteGroup);
groupRouter.get("/all", authProtect, authorize("read_group"), groupService.getAllGroups);
groupRouter.get("/user-groups/", authProtect, authorize("read_group"), groupService.getUserGroups);
groupRouter.post("/request-access/:groupId/", authProtect, groupService.requestAccessToGroup);

export { groupRouter };
