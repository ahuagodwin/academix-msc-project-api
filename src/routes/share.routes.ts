import { authorize, authProtect } from "../middlewares/authorized.md";
import * as shareService from "../controller/shareFile.controller";
import { Router } from "express";

const shareRouter = Router();

shareRouter.post("/file-send/", authProtect, authorize("create_file"), shareService.shareFile);
shareRouter.put("/file-share/:shareId/", authProtect, authorize("update_file"), shareService.updateShareFile);
shareRouter.delete("/file-share/:shareId/", authProtect, authorize("delete_file"), shareService.updateShareFile);
shareRouter.get("/received-files/", authProtect, authorize("read_file"), shareService.getSharedFiles)
shareRouter.post("/request-file-permissions/", authProtect, shareService.requestFilePermissions)

export { shareRouter };
