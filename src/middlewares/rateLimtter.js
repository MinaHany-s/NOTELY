
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5,
    message: {
        success: false,
        message: "Too many registration attempts. Please try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30,
    message: {
        success: false,
        message: "Too many refresh attempts. Please try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

export const captchaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    message: {
        success: false,
        message: "Too many CAPTCHA requests. Please try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
});