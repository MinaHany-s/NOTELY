
import jwt from "jsonwebtoken";
import User from "../../db/models/users.model.js";

const getDiagnosticId = (req) => {
    const value = req.get("x-auth-diag-id");
    return typeof value === "string" && /^[A-Za-z0-9-]{1,64}$/.test(value)
        ? value
        : null;
};

const getSafeEndpoint = (req) => {
    const routePath = typeof req.route?.path === "string" ? req.route.path : "";
    return `${req.baseUrl || ""}${routePath}` || "unknown";
};

const logJwtDiagnostic = (req, {
    authorizationHeaderPresent,
    verificationSucceeded,
    rejectionClassification,
    statusCode,
}) => {
    console.info("[AUTH_DIAG] JWT_AUTH_RESULT", JSON.stringify({
        diagnosticId: getDiagnosticId(req),
        method: req.method,
        endpoint: getSafeEndpoint(req),
        authorizationHeaderPresent,
        verificationSucceeded,
        rejectionClassification,
        statusCode,
    }));
};

const classifyJwtError = (error) => {
    if (error.name === "TokenExpiredError") return "expired token";
    if (error.name === "JsonWebTokenError") {
        if (error.message === "invalid signature") return "invalid signature";
        if (
            error.message === "jwt malformed" ||
            error.message === "jwt must be provided" ||
            error.message === "jwt must be a string" ||
            error.message === "jwt signature is required"
        ) {
            return "malformed token";
        }
    }
    return "other verification error";
};

const authMiddleware = async (req, res, next) => {
    let jwtVerificationSucceeded = false;
    try {
        // 1. Check JWT Secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        // 2. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            logJwtDiagnostic(req, {
                authorizationHeaderPresent: Boolean(authHeader),
                verificationSucceeded: false,
                rejectionClassification: "missing token",
                statusCode: 401,
            });
            return res.status(401).json({
                success: false,
                message: "Authentication required. Token not provided.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            logJwtDiagnostic(req, {
                authorizationHeaderPresent: true,
                verificationSucceeded: false,
                rejectionClassification: "missing token",
                statusCode: 401,
            });
            return res.status(401).json({
                success: false,
                message: "Access token is required.",
            });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        jwtVerificationSucceeded = true;
        logJwtDiagnostic(req, {
            authorizationHeaderPresent: true,
            verificationSucceeded: true,
            rejectionClassification: null,
            statusCode: null,
        });

        // 4. Check token type
        if (decoded.type !== "access") {
            logJwtDiagnostic(req, {
                authorizationHeaderPresent: true,
                verificationSucceeded: true,
                rejectionClassification: "other verification error",
                statusCode: 401,
            });
            return res.status(401).json({
                success: false,
                message: "Invalid token type. Access token required.",
            });
        }

        // 5. Find user
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            logJwtDiagnostic(req, {
                authorizationHeaderPresent: true,
                verificationSucceeded: true,
                rejectionClassification: "other verification error",
                statusCode: 401,
            });
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
            logJwtDiagnostic(req, {
                authorizationHeaderPresent: true,
                verificationSucceeded: false,
                rejectionClassification: classifyJwtError(error),
                statusCode: 401,
            });
            return res.status(401).json({
                success: false,
                message: "Invalid or expired access token.",
            });
        }

        logJwtDiagnostic(req, {
            authorizationHeaderPresent: Boolean(req.headers.authorization),
            verificationSucceeded: jwtVerificationSucceeded,
            rejectionClassification: "other verification error",
            statusCode: error.statusCode || 500,
        });
        next(error);
    }
};

export default authMiddleware;
