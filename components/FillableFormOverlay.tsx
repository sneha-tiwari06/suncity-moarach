'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { formCoordinates, signatureCoordinates, page21ImageCoordinates } from '@/lib/pdf-coordinates';
import { validateAadhaar, validatePAN, validatePhone, validateEmail, formatAadhaar, formatPAN, formatPhone } from '@/lib/utils';
import { FormData, ApplicantData } from '@/lib/types';
import '@/lib/pdfjs-worker'; // Configure PDF.js worker

interface FillableFormOverlayProps {
  pdfUrl: string;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  applicantCount: number;
  onAddApplicant: () => void;
  onSignatureUpload: (signature: string) => void;
}

export default function FillableFormOverlay({
  pdfUrl,
  formData,
  onFormDataChange,
  applicantCount,
  onAddApplicant,
  onSignatureUpload,
}: FillableFormOverlayProps) {
  const [pageDimensions, setPageDimensions] = useState<{ [key: number]: { width: number; height: number } }>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Calculate field positions relative to page display
  const getFieldPosition = (pageNumber: number, fieldCoord: any, pageWidth: number, pageHeight: number) => {
    // PDF coordinates are bottom-left origin, we need to convert to top-left
    // Standard A4: 612 x 792 points
    const pdfWidth = 612;
    const pdfHeight = 792;
    
    const scaleX = pageWidth / pdfWidth;
    const scaleY = pageHeight / pdfHeight;
    
    // Convert from PDF coordinates (bottom-left) to screen coordinates (top-left)
    const x = fieldCoord.x * scaleX;
    const y = (pdfHeight - fieldCoord.y - fieldCoord.height) * scaleY;
    const width = fieldCoord.width * scaleX;
    const height = fieldCoord.height * scaleY;
    
    return { x, y, width, height };
  };

  const handleFieldChange = (pageNumber: number, fieldName: string, value: string) => {
    let formattedValue = value;

    // Apply formatting
    if (fieldName.includes('aadhaar')) {
      formattedValue = formatAadhaar(value);
    } else if (fieldName.includes('pan')) {
      formattedValue = formatPAN(value);
    } else if (fieldName.includes('phone')) {
      formattedValue = formatPhone(value);
    }

    // Validate
    const error = validateField(fieldName, formattedValue);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [`${pageNumber}_${fieldName}`]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${pageNumber}_${fieldName}`];
        return newErrors;
      });
    }

    // Update form data
    const updatedFormData = { ...formData };
    
    if (pageNumber === 8 && fieldName === 'bhkType') {
      updatedFormData.bhkType = formattedValue;
    } else {
      const applicantIndex = pageNumber === 5 ? 0 : pageNumber === 6 ? 1 : pageNumber === 7 ? 2 : 0;
      if (updatedFormData.applicants[applicantIndex]) {
        updatedFormData.applicants[applicantIndex] = {
          ...updatedFormData.applicants[applicantIndex],
          [fieldName]: formattedValue,
        };
      }
    }

    onFormDataChange(updatedFormData);
  };

  const validateField = (fieldName: string, value: string): string => {
    if (fieldName.includes('aadhaar') && value && !validateAadhaar(value)) {
      return 'Invalid Aadhaar number';
    }
    if (fieldName.includes('pan') && value && !validatePAN(value)) {
      return 'Invalid PAN number';
    }
    if (fieldName.includes('phone') && value && !validatePhone(value)) {
      return 'Invalid phone number';
    }
    if (fieldName.includes('email') && value && !validateEmail(value)) {
      return 'Invalid email address';
    }
    return '';
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onSignatureUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFieldValue = (pageNumber: number, fieldName: string): string => {
    if (pageNumber === 8 && fieldName === 'bhkType') {
      return formData.bhkType || '';
    }
    
    const applicantIndex = pageNumber === 5 ? 0 : pageNumber === 6 ? 1 : pageNumber === 7 ? 2 : 0;
    if (formData.applicants[applicantIndex]) {
      return formData.applicants[applicantIndex][fieldName] || '';
    }
    return '';
  };

  const renderFillableFields = (pageNumber: number) => {
    const pageFields = formCoordinates[pageNumber];
    if (!pageFields) return null;

    const pageDimension = pageDimensions[pageNumber];
    if (!pageDimension) return null;

    return Object.entries(pageFields).map(([fieldName, fieldCoord]) => {
      const position = getFieldPosition(pageNumber, fieldCoord, pageDimension.width, pageDimension.height);
      const fieldValue = getFieldValue(pageNumber, fieldName);
      const error = fieldErrors[`${pageNumber}_${fieldName}`];

      // Special handling for BHK Type dropdown on page 8
      if (pageNumber === 8 && fieldName === 'bhkType') {
        return (
          <div
            key={fieldName}
            className="absolute"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
            }}
          >
            <select
              value={fieldValue}
              onChange={(e) => handleFieldChange(pageNumber, fieldName, e.target.value)}
              className={`w-full h-full px-1 text-xs border border-blue-400 bg-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : ''
              }`}
              style={{
                fontSize: `${(fieldCoord.fontSize || 10) * (pageDimension.width / 612)}px`,
              }}
            >
              <option value="">Select BHK Type</option>
              <option value="3bhk">3 BHK</option>
              <option value="4bhk">4 BHK</option>
            </select>
            {error && (
              <div className="absolute top-full left-0 text-xs text-red-500 mt-0.5 whitespace-nowrap">
                {error}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={fieldName}
          className="absolute"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${position.width}px`,
            height: `${position.height}px`,
          }}
        >
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => handleFieldChange(pageNumber, fieldName, e.target.value)}
            className={`w-full h-full px-1 text-xs border border-blue-400 bg-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : ''
            }`}
            style={{
              fontSize: `${(fieldCoord.fontSize || 10) * (pageDimension.width / 612)}px`,
            }}
          />
          {error && (
            <div className="absolute top-full left-0 text-xs text-red-500 mt-0.5 whitespace-nowrap">
              {error}
            </div>
          )}
        </div>
      );
    });
  };

  const renderSignatureField = (pageNumber: number) => {
    const sigCoord = signatureCoordinates[pageNumber];
    if (!sigCoord) return null;

    const pageDimension = pageDimensions[pageNumber];
    if (!pageDimension) return null;

    const position = getFieldPosition(pageNumber, sigCoord, pageDimension.width, pageDimension.height);

    return (
      <div
        key={`signature_${pageNumber}`}
        className="absolute"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
        }}
      >
        {formData.signature ? (
          <img
            src={formData.signature}
            alt="Signature"
            className="w-full h-full object-contain border border-gray-300"
          />
        ) : (
          <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500">
            Signature
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <Document
        file={pdfUrl}
        loading={<div className="flex justify-center p-4">Loading PDF...</div>}
      >
        {/* Page 5 - Applicant 1 */}
        {applicantCount >= 1 && (
          <div className="mb-4 relative">
            <Page
              pageNumber={5}
              width={612}
              onRenderSuccess={(page) => {
                const viewport = page.getViewport({ scale: 1 });
                setPageDimensions(prev => ({
                  ...prev,
                  5: { width: viewport.width, height: viewport.height },
                }));
              }}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-gray-300 shadow-lg"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
                {renderFillableFields(5)}
                {renderSignatureField(5)}
              </div>
            </div>
          </div>
        )}

        {/* Page 6 - Applicant 2 */}
        {applicantCount >= 2 && (
          <div className="mb-4 relative">
            <Page
              pageNumber={6}
              width={612}
              onRenderSuccess={(page) => {
                const viewport = page.getViewport({ scale: 1 });
                setPageDimensions(prev => ({
                  ...prev,
                  6: { width: viewport.width, height: viewport.height },
                }));
              }}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-gray-300 shadow-lg"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
                {renderFillableFields(6)}
                {renderSignatureField(6)}
              </div>
            </div>
          </div>
        )}

        {/* Page 7 - Applicant 3 */}
        {applicantCount >= 3 && (
          <div className="mb-4 relative">
            <Page
              pageNumber={7}
              width={612}
              onRenderSuccess={(page) => {
                const viewport = page.getViewport({ scale: 1 });
                setPageDimensions(prev => ({
                  ...prev,
                  7: { width: viewport.width, height: viewport.height },
                }));
              }}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-gray-300 shadow-lg"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
                {renderFillableFields(7)}
                {renderSignatureField(7)}
              </div>
            </div>
          </div>
        )}

        {/* Page 8 - BHK Selection */}
        <div className="mb-4 relative">
          <Page
            pageNumber={8}
            width={612}
            onRenderSuccess={(page) => {
              const viewport = page.getViewport({ scale: 1 });
              setPageDimensions(prev => ({
                ...prev,
                8: { width: viewport.width, height: viewport.height },
              }));
            }}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="border border-gray-300 shadow-lg"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full pointer-events-auto">
              {renderFillableFields(8)}
              {renderSignatureField(8)}
            </div>
          </div>
        </div>
      </Document>

      {/* Signature Upload Button */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Signature (applies to all applicants)
        </label>
        <input
          ref={signatureInputRef}
          type="file"
          accept="image/*"
          onChange={handleSignatureUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {applicantCount < 3 && (
          <button
            onClick={onAddApplicant}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {applicantCount === 1 ? 'Add Second Applicant' : 'Add Third Applicant'}
          </button>
        )}
      </div>
    </div>
  );
}