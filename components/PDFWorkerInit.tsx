'use client';

/**
 * Client-side PDF.js Worker Initialization Component
 * This ensures the worker is initialized before any PDF rendering
 * Uses a ref to prevent double initialization in React Strict Mode
 */

import { useEffect, useRef } from 'react';
import { pdfjs } from 'react-pdf';

let workerInitialized = false; // Module-level flag to prevent double init

export default function PDFWorkerInit() {
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization (React Strict Mode causes double render in dev)
    if (initRef.current || workerInitialized) {
      return;
    }

    // Configure worker source on client-side
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      initRef.current = true;
      workerInitialized = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[PDF.js] Worker Source:', pdfjs.GlobalWorkerOptions.workerSrc);
        console.log('[PDF.js] Version:', pdfjs.version);
        
        // Verify worker file is accessible (only once)
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
          });
      }
    }

    // Cleanup function (but don't actually destroy worker - it's shared)
    return () => {
      // Don't reset worker on unmount - it's used by other components
      // The worker will be reused if component remounts
    };
  }, []);

  // This component doesn't render anything
  return null;
}
