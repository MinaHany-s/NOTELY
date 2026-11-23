
import { Router } from "express";

import * as UC from "./user.controller.js";
import authMiddleware from "../../middlewares/auth.js";
import validationMiddleware from "../../middlewares/validation.js";
import {
    updateUserSchema,
    changePasswordSchema,
} from "../../validators/user.validator.js";
import adminMiddleware from "../../middlewares/admin.js";

const userRouter = Router();

// Get Current User
userRouter.get("/", authMiddleware, UC.me);

// Update User Profile
userRouter.patch(
    "/",
    authMiddleware,
    validationMiddleware(updateUserSchema),
    UC.update
);

// Change Password
userRouter.patch(
    "/change-password",
    authMiddleware,
    validationMiddleware(changePasswordSchema),
    UC.changePassword
);
// Delete Account
userRouter.delete(
    "/me",
    authMiddleware,
    UC.deleteAccount
);

// ADMIN: get all users
userRouter.get(
    "/admin",
    authMiddleware,
    adminMiddleware,
    UC.getAllUsers
);

userRouter.get(
    "/admin/stats",
    authMiddleware,
    adminMiddleware,
    UC.getAdminStats
);
//ADMIN:get spicfic user
userRouter.get(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    UC.getUserById
);
export default userRouter;

//ADMIN:delete user
userRouter.delete(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    UC.adminDeleteUser
);

//SUPERADMIN: Toggle Admin
userRouter.patch(
    "/admin/:id/toggle-role",
    authMiddleware,
    adminMiddleware,
    UC.toggleUserRole
);

