
import { authorize, authProtect } from "../middlewares/authorized.md";
import { Router } from "express";
import * as documentService from "../controller/document.controller"
import { upload } from "../middlewares/upload";


const documentRouter = Router();

// Document routes
documentRouter.post("/upload/file/", authProtect, authorize("create_file"), upload.single("file"), documentService.createFile);
documentRouter.get("/user/all-files/", authProtect, authorize("read_file"), documentService.getUserFiles);
documentRouter.delete("/file/:fileId/", authProtect, authorize("delete_file"), documentService.deleteFile);
documentRouter.get("/file/:fileId/", authProtect, authorize("read_file"), documentService.getFileById);
documentRouter.get("/files/all/", authProtect, authorize("read_file"), documentService.getAllFiles);
documentRouter.put("/file/:fileId/", authProtect, authorize("update_file"), upload.single("file"), documentService.updateFileWithUpload);

export { documentRouter };