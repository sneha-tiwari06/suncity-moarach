# Suncity Monarch Application Form

A web-based PDF application system for legal document processing with pixel-perfect PDF generation.

## Features

- Multi-page PDF display with fillable fields on pages 5-8
- Single signature upload applies to all signature fields
- Multi-applicant support (add second/third applicant dynamically)
- Dynamic image loading on page 21 based on BHK selection (3/4 BHK)
- Pixel-perfect PDF generation using pdf-lib
- **Admin dashboard with authentication** - Secure login system for admin access
- Admin can view, download, and print submitted applications
- Print-ready output with zero visual deviation

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- react-pdf for PDF rendering
- pdf-lib for PDF manipulation
- MongoDB with Mongoose for database
- Tailwind CSS for styling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Create a `.env.local` file with your MongoDB connection string and JWT secret:
   ```env
   MONGODB_URI=mongodb://localhost:27017/form-suncity
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ADMIN_USERNAME=admin
   ADMIN_EMAIL=admin@suncity.com
   ADMIN_PASSWORD=admin123
   ```

3. Copy the PDF file to `public/form.pdf`:
```bash
cp "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" public/form.pdf
```

4. Create image folders:
```bash
mkdir -p public/images/3bhk
mkdir -p public/images/4bhk
# Add your images to these folders
```

5. Create admin user:
```bash
npm run seed:admin
```
This will create an admin user with credentials from `.env.local` (or defaults: username: `admin`, password: `admin123`)

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Admin Authentication

The admin dashboard requires authentication. To access:

1. Navigate to `/login`
2. Enter admin credentials (created via seeder script)
3. Access granted to `/admin` dashboard

**Default Admin Credentials** (after running `npm run seed:admin`):
- Username: `admin`
- Email: `admin@suncity.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the default password after first login!

See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for detailed authentication documentation.

## Project Structure

- `/app` - Next.js App Router pages
  - `/login` - Admin login page
  - `/admin` - Admin dashboard (protected)
  - `/preview/[id]` - Application preview page
- `/components` - React components
- `/lib` - Utility functions and PDF processing
  - `auth.ts` - Authentication utilities (JWT, cookies)
- `/models` - MongoDB models
  - `User.ts` - User/Admin model
  - `Application.ts` - Application model
- `/scripts` - Utility scripts
  - `seed-admin.js` - Admin user seeder
- `/public/images` - Images for BHK plans (3bhk, 4bhk folders)
- `/public/form.pdf` - Original PDF form

## Field Mapping & Coordinates

Field coordinates are defined in `/lib/pdf-coordinates.ts`. These coordinates are measured from the PDF's coordinate system and must be precise for pixel-perfect alignment.

## Print Validation

The application ensures:
- A4 size output
- No scaling
- No layout shift
- No font substitution
- Identical output to original PDF
