const defaultOrigins = [
    "https://notely-five-pied.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

const configuredOrigins = (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const frontendOrigins = new Set(
    configuredOrigins.length ? configuredOrigins : defaultOrigins
);

export const isTrustedOrigin = (origin) =>
    !origin || frontendOrigins.has(origin);
