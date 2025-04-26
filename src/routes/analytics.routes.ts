import { authorize, authProtect } from "../middlewares/authorized.md";
import * as notifyService from "../controller/analytics.controller";
import { Router } from "express";

const analyticsRouter = Router();

analyticsRouter.get("/analytics/", authProtect, notifyService.getGeneralAnalytics);
export { analyticsRouter };
