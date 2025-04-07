
import { authorize, authProtect } from "../middlewares/authorized.md";
import * as userService from "../controller/user.controller"
import { Router } from "express";


const userRouter = Router();

// AUTHENTICATION routes
userRouter.get("/users/all/", authProtect, authorize("read_users"), userService.getAllUsers)

export { userRouter };