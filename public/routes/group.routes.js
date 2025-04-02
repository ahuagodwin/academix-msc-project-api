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
exports.groupRouter = void 0;
const authorized_md_1 = require("../middlewares/authorized.md");
const groupService = __importStar(require("../controller/group.controller"));
const express_1 = require("express");
const groupRouter = (0, express_1.Router)();
exports.groupRouter = groupRouter;
groupRouter.post("/create/", authorized_md_1.authProtect, groupService.createGroup);
groupRouter.put("/update/:groupId/", authorized_md_1.authProtect, groupService.updateGroup);
groupRouter.post("/add-user-to-group/:groupId/", authorized_md_1.authProtect, groupService.addUsersToGroup);
groupRouter.delete("/delete/:groupId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_group"), groupService.deleteGroup);
groupRouter.get("/all", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_group"), groupService.getAllGroups);
groupRouter.get("/user-groups/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_group"), groupService.getUserGroups);
groupRouter.post("/request-access/:groupId/", authorized_md_1.authProtect, groupService.requestAccessToGroup);
