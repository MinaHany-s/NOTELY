
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

const refreshDiagnostics = (req, res, next) => {
    const rawDiagnosticId = req.get("x-auth-diag-id");
    const diagnosticId =
        typeof rawDiagnosticId === "string" &&
        /^[A-Za-z0-9-]{1,64}$/.test(rawDiagnosticId)
            ? rawDiagnosticId
            : null;
    const cookiePresent = Object.prototype.hasOwnProperty.call(
        req.cookies || {},
        "refreshToken"
    );
    const diagnostics = {
        diagnosticId,
        cookiePresent,
        sessionFound: null,
        storedHashMatched: null,
        hashMatchType: "not_checked",
        refreshTokenRejected: false,
        message: null,
    };

    res.locals.refreshAuthDiagnostics = diagnostics;
    console.info("[AUTH_DIAG] REFRESH_COOKIE", JSON.stringify({
        diagnosticId,
        cookiePresent,
    }));
    res.once("finish", () => {
        let message = diagnostics.message;
        if (!message) {
            message = res.statusCode === 403
                ? "Origin is not allowed"
                : res.statusCode === 429
                    ? "Too many requests"
                    : res.statusCode >= 500
                        ? "internal_error"
                        : "request_rejected";
        }
        console.info("[AUTH_DIAG] REFRESH_RESULT", JSON.stringify({
            diagnosticId: diagnostics.diagnosticId,
            statusCode: res.statusCode,
            message,
            cookiePresent: diagnostics.cookiePresent,
            sessionFound: diagnostics.sessionFound,
            storedHashMatched: diagnostics.storedHashMatched,
            hashMatchType: diagnostics.hashMatchType,
            refreshTokenRejected: diagnostics.refreshTokenRejected,
        }));
    });

    next();
};

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
    refreshDiagnostics,
    trustedOrigin,
    refreshLimiter,
    refreshToken
);


authRouter.post("/logout", trustedOrigin, logout);

export default authRouter;
