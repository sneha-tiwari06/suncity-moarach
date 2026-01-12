'use client';

import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState } from 'react';
import '@/lib/pdfjs-worker'; // Configure PDF.js worker

interface PDFViewerProps {
  pdfUrl: string;
  fillablePages?: number[];
  onFieldChange?: (page: number, field: string, value: string) => void;
  formData?: any;
  showOnlyFillable?: boolean;
}

export default function PDFViewer({
  pdfUrl,
  fillablePages = [5, 6, 7, 8],
  onFieldChange,
  formData,
  showOnlyFillable = false,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const isFillablePage = (pageNumber: number) => {
    return fillablePages.includes(pageNumber);
  };

  return (
    <div className="w-full">
      <div className="w-full flex flex-col items-center">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex justify-center p-4">Loading PDF...</div>}
          error={
            <div className="flex justify-center p-4 text-red-500">
              Error loading PDF. Please ensure the PDF file exists.
            </div>
          }
        >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1;
            
            // If showOnlyFillable is true, only show fillable pages
            if (showOnlyFillable && !isFillablePage(pageNumber)) {
              return null;
            }

            return (
              <div
                key={`page_${pageNumber}`}
                className="mb-4 relative inline-block"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border border-gray-300 shadow-lg"
                />
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
}