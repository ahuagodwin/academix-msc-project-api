
import { authorize, authProtect } from "../middlewares/authorized.md";
import { Router } from "express";
import * as walletService from "../controller/wallet.controller"


const walletRouter = Router();

// Document routes

walletRouter.get("/wallet/", authProtect, authorize("read_wallets"), walletService.getWallet);
walletRouter.get("/all/wallets/", authorize("read_user_wallets"), walletService.getAllWallets)
walletRouter.get("/transactions/wallets/", authorize("read_user_wallets"), walletService.getWalletTransactions)

export { walletRouter };