'use client';

import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState, useCallback, useEffect, useRef } from 'react';
import '@/lib/pdfjs-worker';

interface HighResPDFViewerProps {
  pdfUrl: string;
}

export default function HighResPDFViewer({ pdfUrl }: HighResPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200); // Default width

  // Use native ResizeObserver to track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial width
    setContainerWidth(container.offsetWidth);

    // Create ResizeObserver to track width changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  }

  // Get display width - actual visible size that fits container
  const getDisplayWidth = useCallback(() => {
    if (!containerWidth || containerWidth < 400) {
      return 600; // Default for small screens
    }
    
    // Use container width minus padding to ensure it fits
    // Cap at 800px max to prevent overflow on large screens
    // 100px padding (50px each side) ensures it doesn't touch edges
    return Math.min(containerWidth - 100, 800);
  }, [containerWidth]);

  // Get render width - can be higher for quality, but use display width for now
  // This ensures PDF fits without overflow
  const getPageWidth = useCallback(() => {
    return getDisplayWidth();
  }, [getDisplayWidth]);

  return (
    <div className="w-full">
      {/* PDF Info */}
      {numPages > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            📄 Total Pages: <strong>{numPages}</strong>
          </p>
        </div>
      )}

      {/* Loading State */}
      <div ref={containerRef} className="w-full">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center p-12 text-red-600">
              <p className="text-lg font-semibold mb-2">Error loading PDF</p>
              <p className="text-sm">Please ensure the PDF file exists at: {pdfUrl}</p>
            </div>
          }
          options={{
            cMapUrl: '/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/standard_fonts/',
          }}
        >
          {/* Render all pages */}
          {Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1;
            const displayWidth = getDisplayWidth();

            return (
              <div
                key={`page_${pageNumber}`}
                className="mb-6 relative flex justify-center w-full"
              >
                <div 
                  className="relative shadow-xl bg-white rounded-lg border-2 border-gray-200"
                  style={{
                    maxWidth: `${displayWidth}px`,
                    width: `${displayWidth}px`,
                    overflow: 'hidden',
                    margin: '0 auto',
                  }}
                >
                  {/* Page Number Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                    Page {pageNumber} of {numPages}
                  </div>
                  
                  {/* PDF Page - Properly Sized Rendering */}
                  <Page
                    pageNumber={pageNumber}
                    width={displayWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="block"
                    loading={
                      <div className="flex items-center justify-center p-8 bg-gray-50 min-h-[600px]">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <div className="text-gray-400 text-sm">Loading page {pageNumber}...</div>
                        </div>
                      </div>
                    }
                    onRenderSuccess={(page) => {
                      if (process.env.NODE_ENV === 'development') {
                        console.log(`✓ Page ${pageNumber} rendered at ${displayWidth}px width`);
                      }
                    }}
                    error={
                      <div className="flex items-center justify-center p-8 bg-red-50 min-h-[400px] text-red-600">
                        <div className="text-center">
                          <p className="font-semibold mb-1">Error loading page {pageNumber}</p>
                          <p className="text-sm text-red-500">Please refresh the page</p>
                        </div>
                      </div>
                    }
                  />
                </div>
              </div>
            );
          })}
        </Document>
      </div>

      {/* End of Document Marker */}
      {numPages > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          <p>End of Document</p>
        </div>
      )}
    </div>
  );
}
