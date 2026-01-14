'use client';

import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ApplicantForm from './ApplicantForm';
import ApartmentDeclarationForm from './ApartmentDeclarationForm';
import { FormData, ApplicantData } from '@/lib/types';
// PDF.js worker is initialized in PDFWorkerInit component (imported in layout.tsx)

interface DynamicFormViewerProps {
  pdfUrl: string;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit?: () => void;
  validationTrigger?: number;
}

const initialApplicant: ApplicantData = {
  title: '',
  name: '',
  relation: '',
  sonWifeDaughterOf: '',
  nationality: '',
  age: '',
  dob: '',
  profession: '',
  aadhaar: '',
  photograph: '',
  residentialStatus: '',
  pan: '',
  itWard: '',
  correspondenceAddress: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  telNo: '',
  phone: '',
  email: '',
  signature: '', // Each applicant has their own signature
};

export default function DynamicFormViewer({
  pdfUrl,
  formData,
  onFormDataChange,
  onSubmit,
  validationTrigger,
}: DynamicFormViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const [applicantCount, setApplicantCount] = useState(1);

  // Sync applicantCount with formData.applicants.length
  useEffect(() => {
    setApplicantCount(formData.applicants.length);
  }, [formData.applicants.length]);

  // Use native ResizeObserver to track container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerWidth(container.offsetWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onDocumentLoadError(error: Error) {
    console.error('[PDF.js] Document Load Error:', error);
    console.error('[PDF.js] Error message:', error.message);
    console.error('[PDF.js] Error stack:', error.stack);
  }

  // Memoize Document options to prevent unnecessary reloads
  const documentOptions = useMemo(
    () => ({
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
    }),
    []
  );

  const getDisplayWidth = useCallback(() => {
    if (!containerWidth || containerWidth < 400) {
      return 600;
    }
    return Math.min(containerWidth - 100, 800);
  }, [containerWidth]);

  const handleApplicantChange = (index: number, data: ApplicantData) => {
    const updatedApplicants = [...formData.applicants];
    updatedApplicants[index] = data;
    onFormDataChange({
      ...formData,
      applicants: updatedApplicants,
    });
  };

  // Check if an applicant form is complete (has required fields filled)
  const isApplicantComplete = (applicant: ApplicantData): boolean => {
    if (!applicant) return false;
    
    // Check if name is filled (basic requirement)
    return !!(applicant.name && applicant.name.trim() !== '');
  };

  // Check if applicant 2 is empty (no name filled)
  const isApplicant2Empty = (): boolean => {
    return !formData.applicants[1] || !formData.applicants[1].name || formData.applicants[1].name.trim() === '';
  };

  // Handle adding applicant 2 when applicant 3 exists
  const handleAddApplicant2When3Exists = () => {
    // Ensure applicant 2 exists in the array
    if (!formData.applicants[1]) {
      const newApplicants = [
        formData.applicants[0],
        { ...initialApplicant }, // Add empty applicant 2
        formData.applicants[2], // Keep applicant 3
      ];
      setApplicantCount(3);
      onFormDataChange({
        ...formData,
        applicants: newApplicants,
      });
    }
  };

  const handleAddApplicant = () => {
    if (applicantCount < 3) {
      // Check if first applicant is complete
      const firstApplicant = formData.applicants[0];
      if (!isApplicantComplete(firstApplicant)) {
        alert('Please fill the first applicant form before adding another applicant.');
        return;
      }
      
      if (applicantCount === 1) {
        // When adding from first applicant, add second applicant
        const newApplicants = [...formData.applicants, { ...initialApplicant }];
        setApplicantCount(applicantCount + 1);
        onFormDataChange({
          ...formData,
          applicants: newApplicants,
        });
      } else if (applicantCount === 2) {
        // When adding from second applicant, add third applicant
        const secondApplicant = formData.applicants[1];
        if (!isApplicantComplete(secondApplicant)) {
          alert('Please fill the second applicant form before adding a third applicant.');
          return;
        }
        const newApplicants = [...formData.applicants, { ...initialApplicant }];
        setApplicantCount(applicantCount + 1);
        onFormDataChange({
          ...formData,
          applicants: newApplicants,
        });
      }
    }
  };

  const handleAddThirdApplicant = () => {
    if (applicantCount === 1) {
      // Check if first applicant is complete
      const firstApplicant = formData.applicants[0];
      if (!isApplicantComplete(firstApplicant)) {
        alert('Please fill the first applicant form before adding a third applicant.');
        return;
      }
      
      // Add empty placeholder for applicant 2 and then applicant 3
      const newApplicants = [
        ...formData.applicants,
        { ...initialApplicant }, // Empty applicant 2 placeholder
        { ...initialApplicant }, // Applicant 3
      ];
      setApplicantCount(3);
      onFormDataChange({
        ...formData,
        applicants: newApplicants,
      });
    }
  };

  const handleRemoveApplicant = (index: number) => {
    if (applicantCount > 1 && index > 0) {
      // Remove only the specific applicant
      const updatedApplicants = formData.applicants.filter((_, i) => i !== index);
      onFormDataChange({
        ...formData,
        applicants: updatedApplicants,
      });
      // applicantCount will be updated by useEffect
    }
  };

  const isFormPage = (pageNumber: number) => {
    return pageNumber === 5 || pageNumber === 6 || pageNumber === 7;
  };

  const shouldShowFormForPage = (pageNumber: number) => {
    if (pageNumber === 5 && applicantCount >= 1) return true;
    // Show applicant 2 form if it exists (applicantCount >= 2)
    if (pageNumber === 6 && applicantCount >= 2) return true;
    // Show applicant 3 form if it exists (applicantCount >= 3)
    if (pageNumber === 7 && applicantCount >= 3) return true;
    return false;
  };

  return (
    <div className="w-full">
     

      <div ref={containerRef} className="w-full">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center p-12 text-red-600">
              <p className="text-lg font-semibold mb-2">Error loading PDF</p>
              <p className="text-sm mb-4">Please ensure the PDF file exists at: {pdfUrl}</p>
              <p className="text-xs text-gray-500 text-center max-w-md">
                If you see worker errors, check the browser console.
                <br />
                Make sure pdf.worker.min.js exists in the public folder.
                <br />
                Run: npm run copy-pdf-worker
              </p>
            </div>
          }
          options={documentOptions}
        >
          {/* Render only fillable pages (5-8) - Forms replace pages 5, 6, 7, 8 */}
          {Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1;
            const displayWidth = getDisplayWidth();

            // Skip pages 1-4 and pages 9+ - only show fillable pages (5-8)
            if (pageNumber < 5 || pageNumber > 8) {
              return null;
            }

            // Page 5 - Replace with Applicant 1 Form
            if (pageNumber === 5) {
              return (
                <div key={`form_page_5`} className="mb-6 relative flex justify-center w-full">
                  <div
                    className="relative shadow-xl bg-white rounded-lg border-2 border-blue-300"
                    style={{
                      maxWidth: `${displayWidth}px`,
                      width: `${displayWidth}px`,
                      margin: '0 auto',
                    }}
                  >
                    {/* <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                      Page 5 - Applicant 1 Form
                    </div> */}
                    <div className="p-6">
                      <ApplicantForm
                        applicantNumber={1}
                        data={formData.applicants[0] || { ...initialApplicant }}
                        onChange={(data) => handleApplicantChange(0, data)}
                        canRemove={false}
                        validationTrigger={validationTrigger}
                      />
                      {(applicantCount === 1 || isApplicant2Empty()) && (
                        <div className="mt-6 pt-4 border-t border-gray-300 space-y-3">
                          <button
                            onClick={handleAddApplicant}
                            disabled={!isApplicantComplete(formData.applicants[0])}
                            className={`w-full px-6 py-3 font-semibold rounded-lg shadow-lg transition-colors ${
                              isApplicantComplete(formData.applicants[0])
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            }`}
                          >
                            + Add Second Applicant
                          </button>
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-gray-500">OR</span>
                            </div>
                          </div>
                          <button
                            onClick={handleAddThirdApplicant}
                            disabled={!isApplicantComplete(formData.applicants[0])}
                            className={`w-full px-6 py-3 font-semibold rounded-lg shadow-lg transition-colors ${
                              isApplicantComplete(formData.applicants[0])
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            }`}
                          >
                            + Add Third Applicant (Skip Second)
                          </button>
                          {!isApplicantComplete(formData.applicants[0]) && (
                            <p className="mt-2 text-sm text-gray-500 text-center">
                              Please fill the first applicant form to add another applicant
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Page 6 - Replace with Applicant 2 Form (if exists)
            if (pageNumber === 6) {
              // Show applicant 2 form if it exists (applicantCount >= 2)
              if (applicantCount >= 2 && formData.applicants[1]) {
                return (
                  <div key={`form_page_6`} className="mb-6 relative flex justify-center w-full">
                    <div
                      className="relative shadow-xl bg-white rounded-lg border-2 border-blue-300"
                      style={{
                        maxWidth: `${displayWidth}px`,
                        width: `${displayWidth}px`,
                        margin: '0 auto',
                      }}
                    >
                      {/* <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                        Page 6 - Applicant 2 Form
                      </div> */}
                      <div className="p-6">
                        <ApplicantForm
                          applicantNumber={2}
                          data={formData.applicants[1] || { ...initialApplicant }}
                          onChange={(data) => handleApplicantChange(1, data)}
                          canRemove={true}
                          onRemove={() => handleRemoveApplicant(1)}
                          validationTrigger={validationTrigger}
                        />
                        {applicantCount === 2 && (
                          <div className="mt-6 pt-4 border-t border-gray-300">
                            <button
                              onClick={handleAddApplicant}
                              disabled={!isApplicantComplete(formData.applicants[1])}
                              className={`w-full px-6 py-3 font-semibold rounded-lg shadow-lg transition-colors ${
                                isApplicantComplete(formData.applicants[1])
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              }`}
                            >
                              + Add Third Applicant
                            </button>
                            {!isApplicantComplete(formData.applicants[1]) && (
                              <p className="mt-2 text-sm text-gray-500 text-center">
                                Please fill the second applicant form to add a third applicant
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null; // Don't show page 6 if applicant 2 doesn't exist or is empty
            }

            // Page 7 - Replace with Applicant 3 Form (if exists)
            if (pageNumber === 7) {
              if (applicantCount >= 3) {
                return (
                  <div key={`form_page_7`} className="mb-6 relative flex justify-center w-full">
                    <div
                      className="relative shadow-xl bg-white rounded-lg border-2 border-blue-300"
                      style={{
                        maxWidth: `${displayWidth}px`,
                        width: `${displayWidth}px`,
                        margin: '0 auto',
                      }}
                    >
                      {/* <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                        Page 7 - Applicant 3 Form
                      </div> */}
                      <div className="p-6">
                        <ApplicantForm
                          applicantNumber={3}
                          data={formData.applicants[2] || { ...initialApplicant }}
                          onChange={(data) => handleApplicantChange(2, data)}
                          canRemove={true}
                          onRemove={() => handleRemoveApplicant(2)}
                          validationTrigger={validationTrigger}
                        />
                        {/* Show "Add Second Applicant" button if applicant 2 is empty */}
                        {isApplicant2Empty() && (
                          <div className="mt-6 pt-4 border-t border-gray-300">
                            <button
                              onClick={handleAddApplicant2When3Exists}
                              className="w-full px-6 py-3 font-semibold rounded-lg shadow-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                            >
                              + Add Second Applicant
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null; // Don't show page 7 if applicant 3 doesn't exist
            }

            // Page 8 - Replace with Apartment Declaration Form
            if (pageNumber === 8) {
              return (
                <div key={`form_page_8`} className="mb-6 relative flex justify-center w-full">
                  <div
                    className="relative shadow-xl bg-white rounded-lg border-2 border-green-300"
                    style={{
                      maxWidth: `${displayWidth}px`,
                      width: `${displayWidth}px`,
                      margin: '0 auto',
                    }}
                  >
                    {/* <div className="absolute top-2 left-2 z-10 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                      Page 8 - Apartment Details & Declaration
                    </div> */}
                    <div className="p-6">
                      <ApartmentDeclarationForm
                        formData={formData}
                        onFormDataChange={onFormDataChange}
                        onSubmit={onSubmit || (() => {})}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // This should never be reached since we return null for pages > 8 above
            return null;
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
