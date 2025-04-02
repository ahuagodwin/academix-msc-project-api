"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentRouter = void 0;
const authorized_md_1 = require("../middlewares/authorized.md");
const express_1 = require("express");
const documentService = __importStar(require("../controller/document.controller"));
const upload_1 = require("../middlewares/upload");
const documentRouter = (0, express_1.Router)();
exports.documentRouter = documentRouter;
// Document routes
documentRouter.post("/upload/file/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_file"), upload_1.upload.single("file"), documentService.createFile);
documentRouter.get("/user/all-files/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_file"), documentService.getUserFiles);
documentRouter.delete("/file/:fileId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_file"), documentService.deleteFile);
documentRouter.get("/file/:fileId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_file"), documentService.getFileById);
documentRouter.get("/files/all/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_file"), documentService.getAllFiles);
documentRouter.put("/file/:fileId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_file"), upload_1.upload.single("file"), documentService.updateFileWithUpload);
