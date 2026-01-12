# Quick Fix: PDF Worker 404 Error

## Problem
```
GET http://localhost:3000/pdf.worker.min.js net::ERR_ABORTED 404 (Not Found)
```

The worker file is missing from the `public/` folder.

## Quick Fix (Choose One)

### Option 1: Run the Copy Script (Recommended)

```bash
npm run copy-pdf-worker
```

### Option 2: Manual Copy

**Windows PowerShell:**
```powershell
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.min.js" -Destination "public\pdf.worker.min.js"
```

**Linux/Mac:**
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
```

### Option 3: If node_modules doesn't exist

First install dependencies:
```bash
npm install
```

Then copy the worker:
```bash
npm run copy-pdf-worker
```

## Verify

After copying, check the file exists:
```bash
# Windows
dir public\pdf.worker.min.js

# Linux/Mac
ls public/pdf.worker.min.js
```

## Restart Dev Server

After copying the file:
1. Stop the dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)

## Expected Result

The 404 error should be gone, and PDFs should load correctly!
