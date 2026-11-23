
import { Router } from "express";

import {
    register,
    login,
    refreshToken,
    logout,
} from "./auth.controller.js";
import { loginSchema, registerSchema } from "../../validators/auth.validator.js";
import validationMiddleware from "../../middlewares/validation.js";
import { refreshLimiter, registerLimiter, loginLimiter } from "../../middlewares/rateLimtter.js";
import trustedOrigin from "../../middlewares/trustedOrigin.js";

const authRouter = Router();


authRouter.post(
    "/register",
    registerLimiter,
    validationMiddleware(registerSchema),
    register
);

authRouter.post(
    "/login",
    loginLimiter,
    validationMiddleware(loginSchema),
    login
);

authRouter.post(
    "/refresh-token",
    trustedOrigin,
    refreshLimiter,
    refreshToken
);


authRouter.post("/logout", trustedOrigin, logout);

export default authRouter;
