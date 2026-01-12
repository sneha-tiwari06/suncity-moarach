# Deployment Instructions

## Pre-Deployment Checklist

- [ ] PDF file copied to `public/form.pdf`
- [ ] Field coordinates calibrated in `lib/pdf-coordinates.ts`
- [ ] BHK images placed in `public/images/3bhk/` and `public/images/4bhk/`
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] Print validation completed

## Manual PDF Copy

Since the automated copy may fail, manually copy the PDF:

1. Copy `Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf`
2. Paste to `public/form.pdf` in the project directory

Or use this command (adjust path as needed):

**Windows PowerShell:**
```powershell
Copy-Item "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" -Destination "public\form.pdf"
```

**Linux/Mac:**
```bash
cp "Suncity_Monarch_Application Form FINAL 6 JAN 2025.pdf" public/form.pdf
```

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Copy PDF File**
   - Manually copy PDF to `public/form.pdf`

3. **Set Up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Create `.env.local` with MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/form-suncity
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Add BHK Images**
   - Place images in `public/images/3bhk/` and `public/images/4bhk/`
   - Supported formats: JPG, JPEG, PNG, GIF

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - User Form: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin

## Environment Variables

Create a `.env.local` file in the root directory:

**Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/form-suncity
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**MongoDB Atlas (Production):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/form-suncity?retryWrites=true&w=majority
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Calibrating Field Coordinates

**CRITICAL**: Before deployment, calibrate all field coordinates in `lib/pdf-coordinates.ts`.

See `COORDINATES_GUIDE.md` for detailed instructions.

1. Open PDF in a PDF editor
2. Measure field positions
3. Update coordinates in `lib/pdf-coordinates.ts`
4. Test form filling
5. Adjust until pixel-perfect

## Production Build

1. **Configure MongoDB**

   Use MongoDB Atlas (recommended for production) or ensure MongoDB is running and accessible.

2. **Set Environment Variables**

   Set `MONGODB_URI` and `NEXT_PUBLIC_APP_URL` in your deployment platform's environment variables.

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Server**
   ```bash
   npm start
   ```

   **Note:** MongoDB doesn't require migrations like SQL databases. Collections and indexes are created automatically on first use.

## Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Add `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`

3. **Update Prisma Schema for Serverless**
   - Use connection pooling for PostgreSQL
   - Or use Prisma Data Proxy

4. **Deploy**
   ```bash
   vercel
   ```

## Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t form-suncity .
docker run -p 3000:3000 form-suncity
```

## Print Validation

After deployment, verify print functionality:

1. Fill out complete form
2. Submit and generate PDF
3. Open PDF in browser
4. Press Ctrl+P (or Cmd+P on Mac)
5. Verify:
   - A4 size selected
   - No scaling (100%)
   - All text visible and aligned
   - No layout shift
   - Fonts match original

## Troubleshooting

### PDF Not Loading

- Check `public/form.pdf` exists
- Verify file permissions
- Check file size (not corrupted)

### Fields Not Aligning

- Re-calibrate coordinates in `lib/pdf-coordinates.ts`
- Check PDF page size matches expectations
- Verify coordinate system (bottom-left origin)

### Images Not Appearing on Page 21

- Check images exist in `public/images/{bhkType}/`
- Verify file extensions (jpg, jpeg, png, gif)
- Check file permissions
- Verify image coordinates in `lib/pdf-coordinates.ts`

### Database Errors

- Check `MONGODB_URI` in `.env.local` is correct
- Verify MongoDB service is running (for local MongoDB)
- Check network connectivity (for MongoDB Atlas)
- Verify database permissions and credentials
- Check MongoDB connection string format

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

## Security Considerations

1. **Admin Dashboard**: Add authentication before production
2. **File Upload**: Validate signature file types and sizes
3. **Rate Limiting**: Implement rate limiting for API routes
4. **Input Validation**: All form inputs are validated, but review for your use case
5. **CORS**: Configure CORS if needed

## Performance Optimization

1. **PDF Caching**: Consider caching generated PDFs
2. **Image Optimization**: Optimize BHK images for web
3. **Database Indexing**: Add indexes for frequently queried fields
4. **CDN**: Use CDN for static assets in production
