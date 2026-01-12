# Environment Variables Setup

This document explains how to set up environment variables for the admin authentication system.

## Required Environment Variables

Create a `.env.local` file in the root directory of the project with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/form-suncity
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/form-suncity?retryWrites=true&w=majority

# JWT Secret Key (Change this to a strong random string in production)
# Generate a secure key using: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT Expiration Time (optional, default: 7d)
JWT_EXPIRES_IN=7d

# Admin User Credentials (for seeding - optional)
# These will be used by the seed script to create the default admin user
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@suncity.com
ADMIN_PASSWORD=admin123
```

## Setup Instructions

1. **Create `.env.local` file:**
   ```bash
   cp ENV_SETUP.md .env.local
   # Then edit .env.local with your actual values
   ```

2. **Generate a secure JWT secret:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as your `JWT_SECRET` value.

3. **Set up MongoDB:**
   - Local MongoDB: `mongodb://localhost:27017/form-suncity`
   - MongoDB Atlas: Use your connection string from Atlas dashboard

4. **Create admin user:**
   ```bash
   npm run seed:admin
   ```
   This will create an admin user with the credentials specified in `.env.local` (or defaults if not specified).

## Security Notes

- **Never commit `.env.local` to version control** (it's already in `.gitignore`)
- Change the default `JWT_SECRET` in production
- Change the default admin password after first login
- Use strong passwords for production environments
