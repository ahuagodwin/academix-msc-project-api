

import { Router } from "express"
import * as storageService from "../controller/storage.controller"
import { authorize, authProtect } from "../middlewares/authorized.md";


const storageRouter = Router();

// Subscription routes
storageRouter.post("/create/", authProtect, authorize("create_storage"), storageService.createStorageSpace);
storageRouter.put("/update/:storageId/", authProtect, authorize("update_storage"), storageService.updateStorageSpace);
storageRouter.delete("/delete/:storageId/", authProtect, authorize("delete_storage"), storageService.deleteStorageSpace);
storageRouter.get("/all", authProtect, authorize("read_storage"), storageService.getAllStorageSpaces);

export {  storageRouter };