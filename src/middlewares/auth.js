
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
            return res.status(401).json({
                success: false,
                message: "Authentication required. Token not provided.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required.",
            });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Check token type
        if (decoded.type !== "access") {
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
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token.",
            });
        }

        next(error);
    }
};

export default authMiddleware;
