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
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NOTELY API</title>

            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: Arial, Helvetica, sans-serif;
                    background: #f5f5f5;
                    color: #252525;
                    line-height: 1.7;
                    padding: 60px 20px;
                }

                main {
                    max-width: 760px;
                    margin: auto;
                }

                .top {
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 25px;
                    margin-bottom: 35px;
                }

                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: -1px;
                    margin-bottom: 8px;
                }

                .subtitle {
                    color: #777;
                    font-size: 14px;
                }

                .status {
                    display: inline-block;
                    margin-top: 18px;
                    font-size: 13px;
                    color: #287a45;
                }

                h2 {
                    font-size: 19px;
                    margin-bottom: 12px;
                }

                p {
                    color: #555;
                    font-size: 15px;
                    margin-bottom: 25px;
                }

                .section {
                    margin-bottom: 35px;
                }

                ul {
                    list-style: none;
                }

                li {
                    padding: 10px 0;
                    border-bottom: 1px solid #e5e5e5;
                    color: #555;
                    font-size: 14px;
                }

                li:last-child {
                    border-bottom: none;
                }

                code {
                    background: #eaeaea;
                    padding: 3px 7px;
                    border-radius: 3px;
                    color: #333;
                    font-size: 13px;
                }

                .api-url {
                    display: inline-block;
                    background: #eaeaea;
                    padding: 10px 14px;
                    border-radius: 4px;
                    font-family: monospace;
                }

                footer {
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                    margin-top: 45px;
                    color: #999;
                    font-size: 12px;
                }

                @media (max-width: 600px) {
                    body {
                        padding: 35px 18px;
                    }

                    h1 {
                        font-size: 27px;
                    }
                }
            </style>
        </head>

        <body>
            <main>
                <header class="top">
                    <h1>NOTELY API</h1>
                    <div class="subtitle">
                        Backend service for the NOTELY application.
                    </div>

                    <div class="status">
                        ● Server is running
                    </div>
                </header>

                <section class="section">
                    <h2>About</h2>
                    <p>
                        NOTELY is a note-taking application.
                        This API handles user accounts, authentication,
                        sessions, and note management.
                    </p>
                </section>

                <section class="section">
                    <h2>Built with</h2>
                    <ul>
                        <li>Node.js & Express.js</li>
                        <li>MongoDB & Mongoose</li>
                        <li>JWT Authentication</li>
                        <li>bcrypt & Crypto</li>
                    </ul>
                </section>

                <section class="section">
                    <h2>Available Modules</h2>
                    <ul>
                        <li>Authentication & Sessions</li>
                        <li>User Management</li>
                        <li>Notes Management</li>
                        <li>Admin Dashboard</li>
                    </ul>
                </section>

                <section class="section">
                    <h2>API Base URL</h2>
                    <div class="api-url">/api/v1</div>
                </section>

                <footer>
                    NOTELY API &copy; 2026
                </footer>
            </main>
        </body>
        </html>
    `);
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