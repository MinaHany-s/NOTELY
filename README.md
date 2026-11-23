# NOTELY – Backend API

A RESTful backend API for **NOTELY**, a modern note-taking application that provides secure authentication, session management, user management, and advanced note management features.

Built with Node.js, Express.js, MongoDB, and Mongoose.

## 🌐 Live Demo

| Service | URL |
|---|---|
| Backend API | https://notely-five-pied.vercel.app/ |
| Frontend Application | https://notelyy-drab.vercel.app/ |
| API Documentation | [Postman Documentation](https://documenter.getpostman.com/view/40072844/2sBYPv3XuH) |

**API Base URL:**
```text
https://notely-five-pied.vercel.app/api/v1
```

## 🚀 Features

### Authentication & Security
- User registration and login.
- JWT-based authentication.
- Access Token and Refresh Token mechanism.
- Secure session management.
- HTTP-only cookies for Refresh Tokens.
- Automatic Access Token renewal.
- Password hashing using bcrypt.
- Protected routes and authorization middleware.
- Logout and session invalidation.
- Login rate limiting.

### User Management
- Get current authenticated user.
- Update user profile.
- Change password.
- Delete personal account.
- Admin user management.
- Get user details.
- Delete users.
- Toggle user roles.
- Admin dashboard statistics.

### Notes Management
- Create notes.
- Retrieve all user notes.
- Retrieve a single note.
- Update notes.
- Pin and unpin notes.
- Archive and unarchive notes.
- Move notes to trash.
- Restore deleted notes.
- Permanently delete notes.
- Retrieve archived and trashed notes.
- Notes statistics.

### Session Management
- Persistent user sessions.
- Refresh Token validation.
- Session expiration.
- Automatic cleanup of expired sessions using MongoDB TTL indexes.
- Session revocation on logout.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript Runtime |
| Express.js | Backend Framework |
| MongoDB | NoSQL Database |
| Mongoose | MongoDB ODM |
| JSON Web Token (JWT) | Authentication |
| bcrypt | Password Hashing |
| Axios | HTTP Client (Frontend Integration) |
| express-rate-limit | Rate Limiting |
| PM2 | Process Management |

## 📁 Project Structure

```text
NOTELY/
│
├── src/
│   ├── db/
│   │   └── models/
│   │       ├── users.model.js
│   │       ├── session.model.js
│   │       └── notes.model.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   └── notes/
│   │
│   ├── middlewares/
│   ├── utils/
│   ├── config/
│   └── app.js
│
├── scripts/
│   └── createAdmin.js
│
├── server.js
├── package.json
├── .env.example
└── .gitignore
```

*The structure above illustrates the main architectural areas; actual filenames and nesting may differ.*

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <YOUR_BACKEND_REPOSITORY_URL>
```

### 2. Navigate to the Project

```bash
cd NOTELY
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

FRONTEND_URL=http://localhost:5173
```

For production, the frontend proxies `/api/v1` through its own Vercel origin.
Refresh cookies are host-only, HttpOnly, Secure, and SameSite=Lax by default.
Set `COOKIE_SAME_SITE=none` only when a separate cross-site client explicitly
needs cookie authentication; `Secure` is enforced whenever SameSite=None is used.

**Important:** These are example variable names. Check the backend configuration and `.env.example` to use the exact variable names expected by the application.

Never commit your `.env` file or expose your database credentials or JWT secrets.

### 5. Run the Development Server

```bash
npm run dev
```

Or, if no development script exists:

```bash
node server.js
```

The API should be available at:

```text
http://localhost:5000/api/v1
```

## 📡 API Endpoints

All endpoints are prefixed with:

```text
/api/v1
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/refresh-token` | Refresh Access Token |
| POST | `/auth/logout` | Logout and invalidate session |

### User Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Get current user |
| PATCH | `/users` | Update user profile |
| PATCH | `/users/change-password` | Change password |
| DELETE | `/users/me` | Delete current account |

### Admin Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/admin` | Get all users |
| GET | `/users/admin/:id` | Get user details |
| DELETE | `/users/admin/:id` | Delete a user |
| PATCH | `/users/admin/:id/toggle-role` | Toggle user role |
| GET | `/users/admin/stats` | Get dashboard statistics |

### Notes Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/notes` | Create a note |
| GET | `/notes` | Get all notes |
| GET | `/notes/:id` | Get a single note |
| PATCH | `/notes/:id` | Update a note |
| DELETE | `/notes/:id` | Move note to trash |
| DELETE | `/notes/:id/permanent` | Permanently delete a note |
| PATCH | `/notes/:id/pin` | Pin a note |
| PATCH | `/notes/:id/unpin` | Unpin a note |
| PATCH | `/notes/:id/archive` | Archive a note |
| PATCH | `/notes/:id/restore` | Restore an archived note |
| GET | `/notes/stats` | Get notes statistics |
| GET | `/notes?archived=true` | Get archived notes |
| GET | `/notes?trashed=true` | Get trashed notes |
| PATCH | `/notes/:id/restore-trash` | Restore a trashed note |

For request bodies, response examples, authentication requirements, and additional details, refer to the [Postman API Documentation](https://documenter.getpostman.com/view/40072844/2sBYPv3XuH).

## 🔐 Authentication Flow

NOTELY uses JWT-based authentication with Access Tokens and Refresh Tokens.

1. The user submits login credentials.
2. The backend validates the credentials.
3. The backend generates an Access Token and a Refresh Token.
4. The Refresh Token is stored in a secure HTTP-only cookie.
5. The Access Token is used in protected API requests through the Authorization header.

Example:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

When the Access Token expires, the frontend can request a new one using the Refresh Token cookie.

The Refresh Token is not exposed to JavaScript.

## 🔒 Authorization

- Public routes are accessible without authentication.
- Protected routes require a valid Access Token.
- Admin routes require administrator privileges.
- User-specific resources are protected from unauthorized access.

## 🌍 CORS Configuration

The production frontend is hosted at:

```text
https://notelyy-drab.vercel.app
```

The backend must allow credentialed requests from the configured frontend origin to support cookie-based Refresh Token authentication.

## 🧪 API Testing

The API can be tested using Postman.

[**Open NOTELY API Documentation**](https://documenter.getpostman.com/view/40072844/2sBYPv3XuH)

The Postman collection includes authentication, user management, admin operations, and notes management requests.

## 🚀 Deployment

The backend is deployed on Vercel.

**Production API:**

https://notely-five-pied.vercel.app/

## 👨‍💻 Frontend

The NOTELY frontend is built separately and communicates with this backend through REST API requests.

[**View NOTELY Frontend**](https://notelyy-drab.vercel.app/)

## 📄 License

This project is developed as a software engineering project.

---

**NOTELY – Organize your thoughts. Keep everything in one place.**
