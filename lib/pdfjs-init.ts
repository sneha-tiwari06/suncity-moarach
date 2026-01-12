/**
 * PDF.js Worker Initialization
 * 
 * This file ensures the PDF.js worker is properly initialized
 * before any PDF components try to use it.
 */

import { pdfjs } from 'react-pdf';

// Configure worker source - this MUST be done before any PDF rendering
// The worker file should be in public/pdf.worker.min.js
if (typeof window !== 'undefined') {
  // Set worker source to local file
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  
  // Log configuration in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[PDF.js] Worker Source:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.log('[PDF.js] Version:', pdfjs.version);
    
    // Verify worker file exists
    fetch('/pdf.worker.min.js', { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          console.log('[PDF.js] ✓ Worker file is accessible');
        } else {
          console.error('[PDF.js] ✗ Worker file not found! Status:', response.status);
          console.error('[PDF.js] Run: npm run copy-pdf-worker');
        }
      })
      .catch((error) => {
        console.error('[PDF.js] ✗ Error checking worker file:', error);
        console.error('[PDF.js] Make sure the dev server is running');
      });
  }
}

export default pdfjs;
