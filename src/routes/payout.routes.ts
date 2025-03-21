import {  authProtect } from "../middlewares/authorized.md";
import * as payoutService from "../controller/payout.controller";
import { Router } from "express";

const payoutRouter = Router();

payoutRouter.post("/withdrawal/", authProtect, payoutService.payOut);
payoutRouter.post("/flutterwave-webhook/", authProtect, payoutService.flutterwaveWebhook);

export { payoutRouter };
