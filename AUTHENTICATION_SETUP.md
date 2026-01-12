# Admin Authentication System Setup

This document explains how to set up and use the admin authentication system.

## Overview

The admin authentication system provides secure login functionality for the admin dashboard. It uses:
- **JWT (JSON Web Tokens)** for authentication
- **HTTP-only cookies** for secure token storage
- **bcryptjs** for password hashing
- **MongoDB** for user storage

## Features

- ✅ Secure login page (no signup - admin only)
- ✅ JWT-based authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Protected admin routes via middleware
- ✅ Protected API routes
- ✅ Logout functionality
- ✅ Automatic redirects for unauthenticated users
- ✅ Seeder script to create admin user

## Setup Instructions

### 1. Install Dependencies

All required dependencies should already be installed:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `dotenv` - Environment variable management

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/form-suncity

# JWT Secret Key (IMPORTANT: Change this to a strong random string)
# Generate using: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT Expiration Time (optional, default: 7d)
JWT_EXPIRES_IN=7d

# Admin User Credentials (for seeding - optional)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@suncity.com
ADMIN_PASSWORD=admin123
```

### 3. Create Admin User

Run the seeder script to create the default admin user:

```bash
npm run seed:admin
```

This will:
- Connect to MongoDB
- Check if admin already exists
- Create a new admin user with the credentials from `.env.local` (or defaults)
- Display the created credentials

**Default credentials (if not set in .env.local):**
- Username: `admin`
- Email: `admin@suncity.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default password after first login!

### 4. Start the Application

```bash
npm run dev
```

## Usage

### Login

1. Navigate to `/login`
2. Enter username/email and password
3. Click "Sign In"
4. You'll be redirected to `/admin` dashboard

### Logout

1. Click the "Logout" button in the admin dashboard header
2. You'll be redirected to `/login`

### Accessing Admin Routes

- **Without authentication**: Automatically redirected to `/login` with redirect parameter
- **With valid authentication**: Access granted to admin dashboard
- **With expired/invalid token**: Automatically redirected to `/login` and token cleared

## API Endpoints

### POST `/api/auth/login`
Login endpoint - authenticates user and sets HTTP-only cookie.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@suncity.com",
    "role": "admin"
  }
}
```

### POST `/api/auth/logout`
Logout endpoint - clears authentication cookie.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### GET `/api/auth/me`
Check current authentication status and get user info.

**Response (Authenticated):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@suncity.com",
    "role": "admin"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

## Protected Routes

The following routes are protected and require admin authentication:

- `/admin/*` - Admin dashboard and all admin pages
- `/api/applications` - Application list API
- `/api/applications/[id]` - Application PDF API
- `/api/applications/[id]/form-data` - Application form data API

## Security Features

1. **HTTP-Only Cookies**: Tokens are stored in HTTP-only cookies (not accessible via JavaScript)
2. **Secure Cookies**: In production, cookies are marked as secure (HTTPS only)
3. **Password Hashing**: Passwords are hashed using bcrypt with 12 rounds
4. **JWT Expiration**: Tokens expire after 7 days (configurable)
5. **Role-Based Access**: Only users with `role: 'admin'` can access admin routes
6. **Middleware Protection**: Route-level protection via Next.js middleware
7. **API Route Protection**: All admin API routes verify authentication

## File Structure

```
├── models/
│   └── User.ts                    # User/Admin MongoDB model
├── lib/
│   └── auth.ts                    # Authentication utilities (JWT, cookies)
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page UI
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard (protected)
│   └── api/
│       └── auth/
│           ├── login/route.ts    # Login API
│           ├── logout/route.ts   # Logout API
│           └── me/route.ts       # Auth check API
├── middleware.ts                  # Next.js middleware for route protection
├── scripts/
│   └── seed-admin.js             # Admin user seeder script
└── ENV_SETUP.md                  # Environment variables documentation
```

## Troubleshooting

### "Unauthorized" Error
- Check that you're logged in (cookie exists)
- Verify JWT_SECRET matches between requests
- Check token hasn't expired

### "User not found" Error
- Run the seeder script: `npm run seed:admin`
- Verify MongoDB connection string is correct
- Check username/email is correct

### "Invalid credentials" Error
- Verify password is correct
- Check user exists in database
- Verify user role is 'admin'
- Check user isActive is true

### Cookie Not Set
- Check browser allows cookies
- Verify CORS settings if using different domains
- Check secure flag matches environment (HTTPS in production)

## Security Best Practices

1. **Change Default Password**: Always change the default admin password
2. **Strong JWT Secret**: Use a strong, random JWT_SECRET (32+ characters)
3. **HTTPS in Production**: Always use HTTPS in production environments
4. **Regular Security Updates**: Keep dependencies updated
5. **Monitor Access**: Log authentication attempts and failures
6. **Limit Admin Users**: Only create admin users when necessary
