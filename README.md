# NOTELY Backend

A RESTful API for a note-taking application built with **Node.js, Express.js, and MongoDB**.

## Features

- User Authentication (Register & Login).
- JWT Access Tokens and Refresh Tokens.
- Secure Session Management.
- User Profile Management.
- Notes CRUD Operations.
- Archive, Trash, and Restore Notes.
- Notes Statistics.
- Admin Dashboard.
- User Management and Role Permissions.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd NOTELY
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD=your_admin_password
```

Run the project:

```bash
npm run dev
```

## API Base URL

```text
/api/v1
```

## Security

- Password Hashing.
- HttpOnly Refresh Token Cookies.
- Refresh Token Rotation.
- Rate Limiting.
- Protected Routes and Admin Authorization.

## Author

NOTELY Backend
