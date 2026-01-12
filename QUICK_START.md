# Quick Start Guide

## Immediate Steps (Required)

### 1. Copy PDF File
```bash
# Windows PowerShell
Copy-Item "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" -Destination "public\form.pdf"

# Linux/Mac
cp "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" public/form.pdf
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB Community Edition
- Start MongoDB service
- Connection string: `mongodb://localhost:27017/form-suncity`

**Option B: MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string

### 4. Configure Environment Variables

Create `.env.local` file:
```env
MONGODB_URI=mongodb://localhost:27017/form-suncity
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/form-suncity?retryWrites=true&w=majority
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Add BHK Images (Optional for testing)
Place images in:
- `public/images/3bhk/` - 3 BHK floor plans (JPG, PNG, etc.)
- `public/images/4bhk/` - 4 BHK floor plans (JPG, PNG, etc.)

### 6. Run Development Server
```bash
npm run dev
```

### 7. Access Application
- **User Form**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

## Important: Coordinate Calibration

**CRITICAL**: Before using in production, you must calibrate field coordinates in `lib/pdf-coordinates.ts`.

The current coordinates are **placeholder values** and will NOT align correctly with your PDF.

See `COORDINATES_GUIDE.md` for detailed instructions.

## Testing the Application

1. Open http://localhost:3000
2. Fill out applicant 1 details (page 5)
3. Upload signature (applies to all pages)
4. Select BHK type on page 8 (3 BHK or 4 BHK)
5. Click "Add Second Applicant" if needed (opens page 6)
6. Click "Submit Application"
7. View generated PDF in new tab
8. Click "Edit Application" to return to form

## Admin Dashboard

1. Navigate to http://localhost:3000/admin
2. View all submitted applications
3. Click "View" to see PDF in viewer
4. Click "Download" to download PDF
5. Click "Print" or use Ctrl+P to print

## Troubleshooting

### PDF Not Loading
- Check `public/form.pdf` exists
- Verify file permissions
- Check file is not corrupted

### Fields Not Aligning
- Coordinates need calibration - see `COORDINATES_GUIDE.md`
- Update `lib/pdf-coordinates.ts` with correct positions

### Images Not Appearing on Page 21
- Ensure images exist in `public/images/3bhk/` or `public/images/4bhk/`
- Check file formats (JPG, PNG, GIF supported)
- Verify image coordinates in `lib/pdf-coordinates.ts`

### Database Errors
- Check MongoDB connection string in `.env.local`
- Verify MongoDB service is running (for local)
- Check network connectivity (for Atlas)
- Verify database name in connection string

## Project Status

✅ **Completed:**
- Next.js project structure
- PDF viewer component
- Fillable form overlay
- Multi-applicant support
- Signature upload
- BHK selection and image loading
- PDF generation with pdf-lib
- Admin dashboard
- API routes
- Validation utilities
- Database schema

⚠️ **Required Before Use:**
- Copy PDF file to `public/form.pdf`
- Calibrate coordinates in `lib/pdf-coordinates.ts`
- Add BHK images to `public/images/` folders

📚 **Documentation:**
- `SETUP.md` - Detailed setup instructions
- `COORDINATES_GUIDE.md` - Coordinate calibration guide
- `DEPLOYMENT.md` - Production deployment guide
- `PROJECT_SUMMARY.md` - Complete project overview
- `README.md` - Project overview
