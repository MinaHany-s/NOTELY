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
import { page } from "./templates/opening.js";

const PORT = process.env.PORT || 5000;

const app = express();
app.set("trust proxy", 1);

//TODO: Update this with your frontend
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


app.get("/", (req, res) => {
    res.send(page);
});


// Global Rate Limiter
app.use(`${API_V1}/`, globalLimiter);

app.get(`${API_V1}/`, (req, res) => {
    res.json({
        message: "NOTELY API",
        version: "1.0.0"
    });
});

app.use(`${API_V1}/auth`, authRouter);
app.use(`${API_V1}/users`, userRouter)
app.use(`${API_V1}/notes`, noteRouter)

app.use(errorHandler);

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

export default app;