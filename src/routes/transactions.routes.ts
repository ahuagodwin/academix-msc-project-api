
import { authorize, authProtect } from "../middlewares/authorized.md";
import { Router } from "express";
import * as transactionService from "../controller/transactions.controller"


const transactionRouter = Router();

// Document routes

transactionRouter.get("/all/", authProtect, authorize("read_transactions"), transactionService.getAllTransactions);
transactionRouter.get("/user/transaction/:userId/", authorize("read_user_transactions"), transactionService.getUserTransactions)

export { transactionRouter };