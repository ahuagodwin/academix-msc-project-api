
import * as authService from "../controller/auth.controller";
import { Router } from "express";


const authRouter = Router();

// AUTHENTICATION routes
authRouter.post("/register", authService.register);
authRouter.post("/account/verify", authService.verifyAccountCreation);
authRouter.post("/login", authService.loginUser);
authRouter.post("/login/verify/", authService.verifyLoginOTP);



export { authRouter };