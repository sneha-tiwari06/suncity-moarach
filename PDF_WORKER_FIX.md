# PDF.js Worker Fix

## Problem

The PDF.js worker was failing to load from `cdnjs.cloudflare.com` with a 404 error:
```
Failed to load resource: the server responded with a status of 404
```

## Root Cause

The CDN URL was using `cdnjs.cloudflare.com` which doesn't always have the exact version of pdfjs-dist installed in your project. The version mismatch caused the 404 error.

## Solution

### ✅ Immediate Fix (Applied)

I've updated all components to use **unpkg.com** CDN instead of cdnjs:

- `components/PDFViewer.tsx`
- `components/FillableFormOverlay.tsx`
- `app/admin/page.tsx`

All now import `@/lib/pdfjs-worker` which configures the worker to use:
```
https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js
```

**unpkg.com** is more reliable because:
- It directly mirrors npm packages
- Better version matching
- Always has the latest packages
- Better CDN performance

### 🔧 Alternative: Use Local Worker (Recommended for Production)

For better reliability and offline support, you can use a local worker file:

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Copy worker file**:
   ```bash
   npm run copy-pdf-worker
   ```
   
   Or manually:
   ```bash
   node scripts/copy-pdf-worker.js
   ```

3. **Update worker configuration** in `lib/pdfjs-worker.ts`:
   ```typescript
   // Change from:
   pdfjs.GlobalWorkerOptions.workerSrc = unpkgWorker;
   
   // To:
   pdfjs.GlobalWorkerOptions.workerSrc = localWorker;
   ```

## Files Changed

✅ `lib/pdfjs-worker.ts` - New centralized worker configuration
✅ `components/PDFViewer.tsx` - Now imports worker config
✅ `components/FillableFormOverlay.tsx` - Now imports worker config
✅ `app/admin/page.tsx` - Now imports worker config
✅ `scripts/copy-pdf-worker.js` - New script to copy worker locally
✅ `package.json` - Added `copy-pdf-worker` script and `postinstall` hook

## Verification

After the fix, you should see in the browser console (development mode):
```
PDF.js Worker configured: https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js
PDF.js Version: 4.0.379
```

The PDF should now load without worker errors!

## Troubleshooting

If you still see errors:

1. **Check the version**:
   - Open browser console
   - Look for the "PDF.js Version" log
   - Verify it matches your installed version in `package.json`

2. **Try local worker**:
   - Run `npm run copy-pdf-worker`
   - Update `lib/pdfjs-worker.ts` to use `localWorker`
   - Restart dev server

3. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

4. **Check network**:
   - Ensure you have internet connection (for CDN)
   - Check if unpkg.com is accessible in your region
   - If blocked, use local worker option

## Additional Notes

- The worker file is ~300KB and is required for PDF rendering
- Using local worker reduces external dependencies
- CDN option works immediately without additional setup
- Production deployment should use local worker for better reliability
