# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up MongoDB**
   
   Install and start MongoDB (if not already running):
   
   **Option A: Local MongoDB**
   - Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
   - Start MongoDB service
   - MongoDB will run on `mongodb://localhost:27017`
   
   **Option B: MongoDB Atlas (Cloud)**
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Get your connection string
   
3. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/form-suncity
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   For MongoDB Atlas, use:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/form-suncity?retryWrites=true&w=majority
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Copy PDF File**
   
   Ensure the PDF file is copied to `public/form.pdf`:
   ```bash
   # The PDF should already be copied, but if not:
   cp "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" public/form.pdf
   ```

5. **Add BHK Images**
   
   Place your BHK plan images in the appropriate folders:
   - `public/images/3bhk/` - Place 3 BHK floor plan images here
   - `public/images/4bhk/` - Place 4 BHK floor plan images here
   
   Supported formats: JPG, JPEG, PNG, GIF
   
   Note: The system will use the first image found in each folder.

6. **Calibrate PDF Coordinates**
   
   **IMPORTANT**: The field coordinates in `lib/pdf-coordinates.ts` need to be calibrated based on your actual PDF.
   
   To find exact coordinates:
   1. Open the PDF in a PDF editor
   2. Use annotation tools to measure field positions
   3. PDF coordinates use points (1/72 inch) with origin at bottom-left
   4. Update coordinates in `lib/pdf-coordinates.ts`
   
   Coordinate format:
   ```typescript
   {
     x: number,      // Horizontal position from left edge (in points)
     y: number,      // Vertical position from bottom edge (in points)
     width: number,  // Field width (in points)
     height: number, // Field height (in points)
     fontSize?: number // Optional font size
   }
   ```

## Running the Application

1. **Development Mode**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Access Admin Dashboard**
   
   Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

## Field Coordinate Calibration Guide

### Finding Field Coordinates

1. **Using PDF Annotation Tools:**
   - Open PDF in Adobe Acrobat or similar tool
   - Use measuring tools to find field positions
   - Note: PDF coordinate system has origin at bottom-left

2. **Using pdf-lib Debug Mode:**
   - You can add debug logging in `lib/pdf-generator.ts`
   - Print page dimensions to understand scaling

3. **Testing Approach:**
   - Start with approximate coordinates
   - Test form filling
   - Adjust coordinates based on visual alignment
   - Iterate until pixel-perfect alignment

### Coordinate System

- **PDF Standard Size**: A4 = 612 x 792 points
- **Origin**: Bottom-left corner (0, 0)
- **X-axis**: Increases to the right
- **Y-axis**: Increases upward
- **Unit**: Points (1 point = 1/72 inch)

### Common Issues

- **Fields appear too high/low**: Adjust Y coordinate
- **Fields appear too left/right**: Adjust X coordinate
- **Text too large/small**: Adjust fontSize
- **Fields don't align**: Check if page scaling is correct

## Print Validation

### Testing Print Output

1. Fill out the form completely
2. Submit the form
3. Open the generated PDF
4. Use Ctrl+P (or Cmd+P on Mac) to print
5. Verify:
   - A4 size is selected (no scaling)
   - All text is visible and aligned
   - No layout shift
   - Fonts match original PDF
   - Margins are correct

### Print Settings Checklist

- [ ] Page Size: A4
- [ ] Scaling: None (100%)
- [ ] Margins: Default or None
- [ ] Orientation: Portrait
- [ ] Background Graphics: Enabled (if needed)

## Troubleshooting

### PDF Not Loading

- Ensure `public/form.pdf` exists
- Check file permissions
- Verify PDF is not corrupted

### Fields Not Aligning

- Re-calibrate coordinates in `lib/pdf-coordinates.ts`
- Check if PDF page size matches expectations
- Verify coordinate system (bottom-left origin)

### Images Not Loading on Page 21

- Ensure images exist in `public/images/{bhkType}/` folder
- Check file extensions (supported: jpg, jpeg, png, gif)
- Verify image file permissions

### Database Issues

- Delete `prisma/dev.db` and re-run migrations
- Run `npx prisma generate` to regenerate Prisma client

## Production Deployment

1. Set environment variables
2. Use PostgreSQL or MySQL for production (update `prisma/schema.prisma`)
3. Run migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm start`
