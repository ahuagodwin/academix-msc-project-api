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
exports.roleRouter = void 0;
const authorized_md_1 = require("../middlewares/authorized.md");
const roleService = __importStar(require("../controller/role.controller"));
const express_1 = require("express");
const roleRouter = (0, express_1.Router)();
exports.roleRouter = roleRouter;
// AUTHENTICATION routes
roleRouter.post("/create/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_role"), roleService.createRole);
roleRouter.put("/update/:roleId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_role"), roleService.updateRoleById);
roleRouter.delete("/delete/:roleId/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("delete_role"), roleService.deleteRoleById);
roleRouter.get("/all", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_role"), roleService.getAllRoles);
roleRouter.get("/:roleId", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_role"), roleService.getRoleById);
roleRouter.post("/assign/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("create_role"), roleService.assignRolesToUser);
roleRouter.put("/assign/update/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("update_role"), roleService.updateAssignedRolesToUser);
roleRouter.get("/assign/all/roles/", authorized_md_1.authProtect, (0, authorized_md_1.authorize)("read_role"), roleService.getAllUsersWithRoles);
