
import jwt from "jsonwebtoken";
import User from "../../db/models/users.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Check JWT Secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        // 2. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.info("[AUTH_DIAG] ACCESS_TOKEN_REJECTED", JSON.stringify({
                reason: "missing_access_token",
                statusCode: 401,
            }));
            return res.status(401).json({
                success: false,
                message: "Authentication required. Token not provided.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            console.info("[AUTH_DIAG] ACCESS_TOKEN_REJECTED", JSON.stringify({
                reason: "empty_access_token",
                statusCode: 401,
            }));
            return res.status(401).json({
                success: false,
                message: "Access token is required.",
            });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Check token type
        if (decoded.type !== "access") {
            console.info("[AUTH_DIAG] ACCESS_TOKEN_REJECTED", JSON.stringify({
                reason: "invalid_token_type",
                statusCode: 401,
            }));
            return res.status(401).json({
                success: false,
                message: "Invalid token type. Access token required.",
            });
        }

        // 5. Find user
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        // 6. Attach user to request
        req.user = user;

        next();

    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            if (error.name === "TokenExpiredError") {
                console.info("[AUTH_DIAG] ACCESS_TOKEN_EXPIRED", JSON.stringify({
                    expired: true,
                    statusCode: 401,
                }));
            } else {
                console.info("[AUTH_DIAG] ACCESS_TOKEN_REJECTED", JSON.stringify({
                    reason: "invalid_or_not_active",
                    statusCode: 401,
                }));
            }
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token.",
            });
        }

        next(error);
    }
};

export default authMiddleware;
