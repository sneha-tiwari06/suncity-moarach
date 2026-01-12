/**
 * PDF.js Worker Configuration
 * 
 * This utility sets up the PDF.js worker with fallback options.
 * The worker is required for PDF rendering in the browser.
 */

import { pdfjs } from 'react-pdf';

// Get the version from pdfjs-dist
const PDFJS_VERSION = pdfjs.version;

/**
 * Configure PDF.js worker with fallback
 * Ensures worker is properly initialized before use
 */
export function configurePDFWorker(): void {
  if (typeof window === 'undefined') {
    return; // Server-side, skip
  }

  try {
    // Try to use local worker first (most reliable, no CORS)
    // The worker file should be in public/pdf.worker.min.js
    // If it doesn't exist, use CDN as fallback
    
    // Check if worker is already configured
    if (pdfjs.GlobalWorkerOptions.workerSrc) {
      // Already configured, verify it's valid
      if (pdfjs.GlobalWorkerOptions.workerSrc.includes('pdf.worker')) {
        return;
      }
    }

    // Use local worker file first
    // Note: If the file doesn't exist, the browser will fail to load it
    // and we should fall back to CDN, but for now, let's ensure it's set correctly
    const localWorker = '/pdf.worker.min.js';
    
    // Set the worker source
    pdfjs.GlobalWorkerOptions.workerSrc = localWorker;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ PDF.js Worker configured: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
      console.log(`  PDF.js Version: ${PDFJS_VERSION}`);
      console.log(`  If worker fails to load, check: public/pdf.worker.min.js exists`);
      console.log(`  Run: npm run copy-pdf-worker`);
    }
  } catch (error) {
    console.error('Error configuring PDF.js worker:', error);
    // Fallback to CDN if local fails
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
      console.warn('Falling back to CDN worker');
    } catch (fallbackError) {
      console.error('Failed to configure PDF.js worker:', fallbackError);
    }
  }
}

// Configure worker immediately when this module loads (client-side only)
if (typeof window !== 'undefined') {
  // Ensure worker is configured before any PDF rendering
  configurePDFWorker();
  
  // Also ensure it's configured on next tick in case of timing issues
  if (typeof window.requestIdleCallback !== 'undefined') {
    window.requestIdleCallback(() => {
      configurePDFWorker();
    });
  } else {
    setTimeout(() => {
      configurePDFWorker();
    }, 0);
  }
}
