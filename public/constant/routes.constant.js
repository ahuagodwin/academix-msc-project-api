"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndAssignRoutes = void 0;
const types_1 = require("../types/types"); // Assuming UserPermission types are defined
const permission_model_1 = __importDefault(require("../models/permission.model"));
const env_1 = require("../config/env");
const route_model_1 = __importDefault(require("../models/route.model"));
// Function to create permissions for a route
const createPermissionsForRoute = async (routeName, userId, roleId) => {
    // Define permissions for the route (create, read, update, delete)
    const permissions = [
        types_1.UserPermission.CREATE,
        types_1.UserPermission.READ,
        types_1.UserPermission.UPDATE,
        types_1.UserPermission.DELETE
    ].map((perm) => ({
        name: perm,
        description: `Allows user to ${perm} resources for ${routeName}`,
        userId: userId,
        roleId: roleId,
    }));
    // Insert permissions into the database and return their _id
    const insertedPermissions = await permission_model_1.default.insertMany(permissions);
    return insertedPermissions;
};
// Function to create and assign routes to the user
const createAndAssignRoutes = async (newUser, roleId, session) => {
    // Define default routes
    const defaultRoutes = [
        { name: "Dashboard", path: `${env_1.FRONTEND_URL_LOCAL}/dashboard`, description: "User dashboard" },
        { name: "Profile", path: `${env_1.FRONTEND_URL_LOCAL}/profile`, description: "User profile settings" },
        { name: "Settings", path: `${env_1.FRONTEND_URL_LOCAL}/settings`, description: "Application settings" }
    ];
    // Create routes and permissions for the user
    const routesWithPermissions = await Promise.all(defaultRoutes.map(async (route) => {
        // Create permissions for each route
        const createdPermissions = await createPermissionsForRoute(route.name, newUser._id, roleId);
        // Insert the route with the associated permission
        const newRoute = new route_model_1.default({
            ...route,
            userId: newUser._id, // Assign user to the route
            permissionId: createdPermissions.map((perm) => perm._id),
        });
        // Save the route
        await newRoute.save({ session });
        return newRoute;
    }));
    // Update the user's routes field with the inserted route IDs
    newUser.routes = routesWithPermissions.map((route) => route._id);
    await newUser.save({ session });
};
exports.createAndAssignRoutes = createAndAssignRoutes;
