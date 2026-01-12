# CORS Error Fix - PDF.js Worker

## Problem

You're seeing CORS errors when trying to load the PDF.js worker from CDN:
```
Access to script at 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Root Causes

1. **CORS Policy**: unpkg.com may block cross-origin requests in some browsers/environments
2. **Version Mismatch**: The version (4.8.69) doesn't match your installed version (4.0.379)
3. **CDN Issues**: External CDNs can have CORS restrictions

## Solution: Use Local Worker File

The best solution is to use a **local worker file** instead of CDN. This:
- ✅ Eliminates CORS issues completely
- ✅ Works offline
- ✅ Faster (no network request)
- ✅ More reliable
- ✅ Version matches your installed package

## Steps to Fix

### Step 1: Install Dependencies

If you haven't already:
```bash
npm install
```

### Step 2: Copy Worker File

Run the copy script:
```bash
npm run copy-pdf-worker
```

Or manually:
```bash
node scripts/copy-pdf-worker.js
```

Or manually copy:
```bash
# Windows PowerShell
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.min.js" -Destination "public\pdf.worker.min.js"

# Linux/Mac
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
```

### Step 3: Verify

Check that the file exists:
```bash
# Should show the file
ls public/pdf.worker.min.js
```

### Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Clear Browser Cache

- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache

## Verification

After fixing, you should see in the browser console:
```
PDF.js Worker configured: /pdf.worker.min.js
PDF.js Version: 4.0.379
```

**No more CORS errors!** ✅

## Current Configuration

The worker is now configured to use:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

This loads the worker from your `public/` folder, served by Next.js, which:
- Has no CORS restrictions (same origin)
- Matches your installed version exactly
- Works reliably

## Troubleshooting

### Worker file not found

If you see "Failed to load worker" errors:

1. **Check file exists**:
   ```bash
   ls public/pdf.worker.min.js
   ```

2. **Re-copy the file**:
   ```bash
   npm run copy-pdf-worker
   ```

3. **Check file permissions**:
   - Ensure the file is readable
   - Check `public/` folder permissions

### Still seeing CORS errors

If you still see CORS errors after using local worker:

1. **Clear browser cache** completely
2. **Restart dev server**
3. **Check browser console** for exact error
4. **Verify file is being served**:
   - Open: `http://localhost:3000/pdf.worker.min.js`
   - Should download the file (not 404)

### Version mismatch

If you see version errors:

1. **Check installed version**:
   ```bash
   npm list pdfjs-dist
   ```

2. **Reinstall if needed**:
   ```bash
   npm install pdfjs-dist@4.0.379
   npm run copy-pdf-worker
   ```

## Alternative: Use jsdelivr CDN (If Local Doesn't Work)

If for some reason the local worker doesn't work, you can temporarily use jsdelivr (better CORS support):

In `lib/pdfjs-worker.ts`, change:
```typescript
// From:
pdfjs.GlobalWorkerOptions.workerSrc = localWorker;

// To:
pdfjs.GlobalWorkerOptions.workerSrc = jsdelivrWorker;
```

But **local worker is recommended** for production.

## Summary

✅ **Fixed**: Worker now uses local file (`/pdf.worker.min.js`)
✅ **No CORS**: Same-origin request, no CORS issues
✅ **Version Match**: Uses exact version from your `node_modules`
✅ **Reliable**: No external dependencies

Run `npm install && npm run copy-pdf-worker` and restart your dev server!
