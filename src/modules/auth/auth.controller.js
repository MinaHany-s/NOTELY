
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../../../db/models/users.model.js";
import Session from "../../../db/models/session.model.js";

// Token settings
const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_DAYS = 7;
const isSecureDeployment =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const REFRESH_REPLAY_GRACE_MS = 30 * 1000;
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;
const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
const cookieSameSite = ["lax", "strict", "none"].includes(configuredSameSite)
    ? configuredSameSite
    : "lax";

const getRefreshTokenExpiry = () => {
    return new Date(
        Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
    );
};

const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

const generateAccessToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId: user._id.toString(),
            type: "access",
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY,
        }
    );
};

const refreshCookieOptions = {
    httpOnly: true,
    secure: isSecureDeployment || process.env.COOKIE_SECURE === "true" || cookieSameSite === "none",
    sameSite: cookieSameSite,
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
};

const clearRefreshCookie = (res) => res.clearCookie("refreshToken", {
    httpOnly: refreshCookieOptions.httpOnly,
    secure: refreshCookieOptions.secure,
    sameSite: refreshCookieOptions.sameSite,
    path: refreshCookieOptions.path,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
});

// ==================================
// REGISTER
// ==================================

export const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (
            !firstName?.trim() ||
            !lastName?.trim() ||
            !email?.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }

        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password,
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }

        next(error);
    }
};

// ==================================
// LOGIN
// ==================================

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate Access Token
        const accessToken = generateAccessToken(user);
        // Generate Refresh Token
        const refreshToken = crypto.randomBytes(64).toString("hex");

        // Hash Refresh Token before saving
        const refreshTokenHash = hashRefreshToken(refreshToken);

        // Save Session in MongoDB
        await Session.create({
            user: user._id,
            refreshTokenHash,
            previousRefreshTokenHash: null,
            previousRefreshTokenExpiresAt: null,
            userAgent: req.get("user-agent"),
            ip: req.ip,
            expiresAt: getRefreshTokenExpiry(),
        });

        // Send Refresh Token as HttpOnly Cookie
        res.cookie(
            "refreshToken",
            refreshToken,
            refreshCookieOptions
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==================================
// REFRESH TOKEN
// ==================================

export const refreshToken = async (req, res, next) => {
    try {
        const oldRefreshToken = req.cookies?.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const oldRefreshTokenHash = hashRefreshToken(oldRefreshToken);
        const now = new Date();
        const newRefreshToken = crypto.randomBytes(64).toString("hex");
        const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

        const session = await Session.findOneAndUpdate(
            {
                refreshTokenHash: oldRefreshTokenHash,
                revokedAt: null,
                expiresAt: { $gt: now },
            },
            [
                {
                    $set: {
                        previousRefreshTokenHash: "$refreshTokenHash",
                        previousRefreshTokenExpiresAt: new Date(Date.now() + REFRESH_REPLAY_GRACE_MS),
                        refreshTokenHash: newRefreshTokenHash,
                        expiresAt: getRefreshTokenExpiry(),
                    },
                },
            ],
            { new: true, updatePipeline: true }
        );

        if (!session) {
            // A second request from another tab can arrive with the same token while
            // the first request is rotating it. Serve access restoration during a
            // short replay grace period without starting another rotation.
            let replaySession = null;
            for (let attempt = 0; attempt < 3 && !replaySession; attempt += 1) {
                if (attempt > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 25));
                }
                replaySession = await Session.findOne({
                    previousRefreshTokenHash: oldRefreshTokenHash,
                    previousRefreshTokenExpiresAt: { $gt: new Date() },
                    revokedAt: null,
                    expiresAt: { $gt: new Date() },
                });
            }

            if (replaySession) {
                const replayUser = await User.findById(replaySession.user);
                if (!replayUser) {
                    await Session.updateOne(
                        { _id: replaySession._id, revokedAt: null },
                        { $set: { revokedAt: new Date() } }
                    );
                    clearRefreshCookie(res);
                    return res.status(401).json({
                        success: false,
                        message: "User no longer exists",
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Token refresh restored",
                    data: {
                        accessToken: generateAccessToken(replayUser),
                    },
                });
            }

            // Detect reuse after the grace period and revoke the session.
            const reusedSession = await Session.findOne({
                previousRefreshTokenHash: oldRefreshTokenHash,
                revokedAt: null,
            });
            if (reusedSession) {
                await Session.updateOne(
                    { _id: reusedSession._id, revokedAt: null },
                    { $set: { revokedAt: new Date() } }
                );
            }

            clearRefreshCookie(res);

            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
            });
        }

        const user = await User.findById(session.user);

        if (!user) {
            session.revokedAt = new Date();
            await session.save();

            return res.status(401).json({
                success: false,
                message: "User no longer exists",
            });
        }

        // Generate new Access Token
        const accessToken = generateAccessToken(user);
        res.cookie(
            "refreshToken",
            newRefreshToken,
            refreshCookieOptions
        );

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==================================
// LOGOUT
// ==================================

export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            const refreshTokenHash = hashRefreshToken(refreshToken);

            await Session.findOneAndUpdate(
                {
                    refreshTokenHash,
                    revokedAt: null,
                },
                {
                    revokedAt: new Date(),
                }
            );
        }

        clearRefreshCookie(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
};
