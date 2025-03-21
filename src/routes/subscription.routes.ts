
import { authorize, authProtect } from "../middlewares/authorized.md";
import { Router } from "express"
import * as subscriptionServices from "../controller/subscription.controller"


const subscriptionRouter = Router();

// Subscription routes
subscriptionRouter.post("/buy-storage/", authProtect, authorize("create_subscription"), subscriptionServices.purchaseStorage);
subscriptionRouter.get("/check-available-storage/", authProtect, authorize("read_subscription"), subscriptionServices.checkAvailableStorage);
subscriptionRouter.delete("/storage-plans/:purchaseId/", authProtect, authorize("read_subscription"), subscriptionServices.deleteStoragePurchase);
subscriptionRouter.get("/user-storage-purchases/", authProtect, authorize("read_subscription"), subscriptionServices.getUserStoragePurchases);
subscriptionRouter.get("/storage-purchased/:purchaseId/", authProtect, authorize("read_subscription"), subscriptionServices.getStoragePurchaseById);

export { subscriptionRouter };