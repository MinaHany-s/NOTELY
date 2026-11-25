
import { Router } from "express";

import {
    createCaptcha,
    register,
    login,
    refreshToken,
    logout,
} from "./auth.controller.js";
import { loginSchema, registerSchema } from "../../validators/auth.validator.js";
import validationMiddleware from "../../middlewares/validation.js";
import { refreshLimiter, registerLimiter, loginLimiter, captchaLimiter } from "../../middlewares/rateLimtter.js";
import trustedOrigin from "../../middlewares/trustedOrigin.js";
import verifyCaptcha from "../../middlewares/verifyCaptcha.js";

const authRouter = Router();

authRouter.get(
    "/captcha",
    trustedOrigin,
    captchaLimiter,
    createCaptcha
);

authRouter.post(
    "/register",
    registerLimiter,
    validationMiddleware(registerSchema),
    verifyCaptcha,
    register
);

authRouter.post(
    "/login",
    loginLimiter,
    validationMiddleware(loginSchema),
    verifyCaptcha,
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
