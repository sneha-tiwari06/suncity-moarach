# Quick Start: Admin Authentication

## 1. Setup Environment Variables

Create `.env.local` in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/form-suncity
JWT_SECRET=your-secret-key-here-change-this
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@suncity.com
ADMIN_PASSWORD=admin123
```

## 2. Create Admin User

```bash
npm run seed:admin
```

This will create an admin user with:
- Username: `admin` (or from ADMIN_USERNAME env var)
- Email: `admin@suncity.com` (or from ADMIN_EMAIL env var)
- Password: `admin123` (or from ADMIN_PASSWORD env var)

## 3. Start the Application

```bash
npm run dev
```

## 4. Login

1. Navigate to `http://localhost:3000/login`
2. Enter admin credentials
3. Click "Sign In"
4. You'll be redirected to `/admin` dashboard

## 5. Access Admin Dashboard

- URL: `http://localhost:3000/admin`
- Protected: Requires authentication
- If not logged in, automatically redirected to `/login`

## Default Credentials

- **Username**: `admin`
- **Email**: `admin@suncity.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password after first login!
