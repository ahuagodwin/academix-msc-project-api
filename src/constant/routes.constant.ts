import mongoose from "mongoose";
import { UserPermission } from "../types/types";  // Assuming UserPermission types are defined
import Permissions from "../models/permission.model";
import { FRONTEND_URL_LOCAL } from "../config/env";
import Routes from "../models/route.model";

// Function to create permissions for a route
const createPermissionsForRoute = async (routeName: string, userId: mongoose.Types.ObjectId, roleId: mongoose.Types.ObjectId) => {
    // Define permissions for the route (create, read, update, delete)
    const permissions = [
        UserPermission.CREATE,
        UserPermission.READ,
        UserPermission.UPDATE,
        UserPermission.DELETE
    ].map((perm) => ({
        name: perm,
        description: `Allows user to ${perm} resources for ${routeName}`,
        userId: userId,
        roleId: roleId,
    }));

    // Insert permissions into the database and return their _id
    const insertedPermissions = await Permissions.insertMany(permissions);
    return insertedPermissions;
};

// Function to create and assign routes to the user
export const createAndAssignRoutes = async (newUser: any, roleId: mongoose.Types.ObjectId, session: any) => {
    // Define default routes
    const defaultRoutes = [
        { name: "Dashboard", path: `${FRONTEND_URL_LOCAL}/dashboard`, description: "User dashboard" },
        { name: "Profile", path: `${FRONTEND_URL_LOCAL}/profile`, description: "User profile settings" },
        { name: "Settings", path: `${FRONTEND_URL_LOCAL}/settings`, description: "Application settings" }
    ];

    // Create routes and permissions for the user
    const routesWithPermissions = await Promise.all(defaultRoutes.map(async (route) => {
        // Create permissions for each route
        const createdPermissions = await createPermissionsForRoute(route.name, newUser._id, roleId);

        // Insert the route with the associated permission
        const newRoute = new Routes({
            ...route,
            userId: newUser._id,  // Assign user to the route
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
