
import "dotenv/config";
import express from "express";
import dbConnection from "./db/connectionDB.js";
import userRouter from "./src/modules/users/user.routes.js";
import authRouter from "./src/modules/auth/auth.routes.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import noteRouter from "./src/modules/notes/note.routes.js";
import helmet from "helmet";
import cors from "cors";
import { globalLimiter } from "./src/middlewares/rateLimtter.js";

const PORT = process.env.PORT || 5000;

const app = express();

app.set("trust proxy", 1);

// CORS
app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(helmet());

app.use(express.json({
    limit: "100kb",
}));

app.use(cookieParser());

// API Versioning
const API_V1 = "/api/v1";

// Global Rate Limiter
app.use(`${API_V1}/`, globalLimiter);

// API Health Check
app.get(`${API_V1}/`, (req, res) => {
    res.status(200).json({
        success: true,
        message: "NOTELY API",
        version: "1.0.0",
    });
});

// Routes
app.use(`${API_V1}/auth`, authRouter);
app.use(`${API_V1}/users`, userRouter);
app.use(`${API_V1}/notes`, noteRouter);

// Error Handler
app.use(errorHandler);

// Local Development
if (process.env.NODE_ENV !== "production") {
    const startServer = async () => {
        try {
            await dbConnection();

            app.listen(PORT, () => {
                console.log(`App listening on PORT: ${PORT}`);
            });
        } catch (error) {
            console.error("Failed to start server:", error);
            process.exit(1);
        }
    };

    startServer();
}

// Vercel Serverless Handler
const handler = async (req, res) => {
    try {
        await dbConnection();
        return app(req, res);
    } catch (error) {
        console.error("Database Connection Error:", error);

        return res.status(503).json({
            success: false,
            message: "Database connection unavailable",
        });
    }
};

export default handler;
