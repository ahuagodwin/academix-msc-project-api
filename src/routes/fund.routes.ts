import { authProtect } from "../middlewares/authorized.md";
import * as fundWallerService from "../controller/fundwallet.controller";
import { Router } from "express";

const fundWalletRouter = Router();

fundWalletRouter.post("/wallet/", authProtect, fundWallerService.fundWallet);
fundWalletRouter.post("/verify-payment/:transactionId/", authProtect, fundWallerService.verifyFlutterwavePayment);

export { fundWalletRouter };
