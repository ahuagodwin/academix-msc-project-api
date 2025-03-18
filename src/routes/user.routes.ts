import { Router } from "express";
import * as userServices from "../controller/user.controller" 

const userRouter = Router();


userRouter.get("/:userId/school/:schoolId/", userServices.getUser);

userRouter.get("/:userId/school/:schoolId/user-permission-routes/role/:roleId/");

userRouter.get("/:userId/school/:schoolId/role/:roleId/routes");

userRouter.put("/routes/:routeIds/");


export { userRouter };