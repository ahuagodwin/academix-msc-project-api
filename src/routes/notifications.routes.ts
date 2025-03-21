import { authorize, authProtect } from "../middlewares/authorized.md";
import * as notifyService from "../controller/notification.controller";
import { Router } from "express";

const notificationRouter = Router();

notificationRouter.get("/notified/", authProtect, authorize("read_notification"), notifyService.getUserNotifications);
export { notificationRouter };
