
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../../../db/models/users.model.js";
import Session from "../../../db/models/session.model.js";

// Token settings
const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_DAYS = 7;

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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
};

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

        const session = await Session.findOne({
            refreshTokenHash: oldRefreshTokenHash,
            revokedAt: null,
            expiresAt: { $gt: new Date() },
        });

        if (!session) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/v1/auth",
            });

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

        // Generate new Refresh Token
        const newRefreshToken = crypto.randomBytes(64).toString("hex");

        const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

        // Rotate the stored Refresh Token Hash
        session.refreshTokenHash = newRefreshTokenHash;
        session.expiresAt = getRefreshTokenExpiry();

        await session.save();

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

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/api/v1/auth",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
};
