import {  authProtect } from "../middlewares/authorized.md";
import * as financialSummaryService from "../controller/financialSummary.controller";
import { Router } from "express";

const financialSummaryRouter = Router();

financialSummaryRouter.get("/summary/", authProtect, financialSummaryService.getFinancialSummary);
financialSummaryRouter.get("/outflow-summary/", authProtect, financialSummaryService.getOutflowSummary);

export { financialSummaryRouter };
