
export const page = `
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
            background: #f7f7f7;
            color: #252525;
            line-height: 1.6;
            padding: 45px 20px;
        }

        main {
            max-width: 850px;
            margin: auto;
        }

        header {
            padding-bottom: 25px;
            border-bottom: 1px solid #ddd;
            margin-bottom: 30px;
        }

        h1 {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .subtitle {
            color: #777;
            font-size: 14px;
        }

        .status {
            color: #287a45;
            font-size: 13px;
            margin-top: 15px;
        }

        section {
            margin-bottom: 35px;
        }

        h2 {
            font-size: 20px;
            margin-bottom: 12px;
        }

        p {
            color: #555;
            font-size: 14px;
        }

        .base-url {
            background: #eee;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            overflow-wrap: anywhere;
        }

        .endpoint {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            padding: 12px;
            border-bottom: 1px solid #e5e5e5;
            background: #fff;
        }

        .method {
            min-width: 75px;
            font-size: 12px;
            font-weight: bold;
            font-family: monospace;
        }

        .get { color: #287a45; }
        .post { color: #2563a6; }
        .patch { color: #a16a16; }
        .delete { color: #c0392b; }

        .path {
            font-family: monospace;
            font-size: 13px;
            overflow-wrap: anywhere;
        }

        .description {
            color: #777;
            font-size: 13px;
            margin-left: auto;
        }

        .note {
            background: #fff;
            border-left: 3px solid #aaa;
            padding: 12px;
            color: #666;
            font-size: 13px;
            margin-top: 12px;
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
                padding: 25px 15px;
            }

            h1 {
                font-size: 27px;
            }

            .description {
                width: 100%;
                margin-left: 87px;
            }
        }
    </style>
</head>

<body>
    <main>
        <header>
            <h1>NOTELY API</h1>
            <div class="subtitle">
                Backend API for a note-taking application.
            </div>
            <div class="status">● Server is running</div>
        </header>

        <section>
            <h2>About</h2>
            <p>
                NOTELY provides user authentication, session management,
                profile management, and note management with archive,
                trash, and restore functionality.
            </p>
        </section>

        <section>
            <h2>Technologies</h2>
            <p>
                Node.js · Express.js · MongoDB · Mongoose · JWT · bcrypt
            </p>
        </section>

        <section>
            <h2>API Base URL</h2>
            <div class="base-url">/api/v1</div>
        </section>

        <section>
            <h2>Authentication</h2>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/auth/register</span>
                <span class="description">Create account</span>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/auth/login</span>
                <span class="description">Login</span>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/auth/refresh</span>
                <span class="description">Refresh access token</span>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/auth/logout</span>
                <span class="description">Logout</span>
            </div>
        </section>

        <section>
            <h2>Users</h2>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/users/me</span>
                <span class="description">Current user profile</span>
            </div>

            <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/users/me</span>
                <span class="description">Update profile</span>
            </div>
        </section>

        <section>
            <h2>Notes</h2>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/notes</span>
                <span class="description">Get user notes</span>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/notes</span>
                <span class="description">Create note</span>
            </div>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/notes/:id</span>
                <span class="description">Get note details</span>
            </div>

            <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/notes/:id</span>
                <span class="description">Update note</span>
            </div>

            <div class="endpoint">
                <span class="method delete">DELETE</span>
                <span class="path">/notes/:id</span>
                <span class="description">Move note to trash</span>
            </div>

            <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/notes/:id/archive</span>
                <span class="description">Archive note</span>
            </div>

            <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/notes/:id/restore</span>
                <span class="description">Restore note</span>
            </div>
        </section>

        <section>
            <h2>Admin</h2>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/users/admin/stats</span>
                <span class="description">Dashboard statistics</span>
            </div>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/users/admin/</span>
                <span class="description">Get all users</span>
            </div>

            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/users/admin//:id</span>
                <span class="description">Get user details and notes</span>
            </div>

            <div class="endpoint">
                <span class="method patch">PATCH</span>
                <span class="path">/users/admin/:id/toggle-role</span>
                <span class="description">Toggle user role</span>
            </div>

            <div class="endpoint">
                <span class="method delete">DELETE</span>
                <span class="path">/users/admin/:id</span>
                <span class="description">Delete user</span>
            </div>
        </section>

        <div class="note">
            Protected endpoints require authentication.
            Admin endpoints require administrator privileges.
            All paths above are relative to /api/v1.
        </div>

        <footer>
            NOTELY API &copy; 2026
        </footer>
    </main>
</body>
</html>
`;
