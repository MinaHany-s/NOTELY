import { isTrustedOrigin } from "../config/frontendOrigins.js";

export default function trustedOrigin(req, res, next) {
    if (isTrustedOrigin(req.get("origin"))) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Origin is not allowed",
    });
}
