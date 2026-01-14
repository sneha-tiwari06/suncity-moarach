'use client';

import { useState } from 'react';
import DynamicFormViewer from '@/components/DynamicFormViewer';
import { FormData, ApplicantData } from '@/lib/types';

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

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    applicants: [{ ...initialApplicant }],
    bhkType: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationTrigger, setValidationTrigger] = useState(0);

  const handleFormDataChange = (data: FormData) => {
    setFormData(data);
  };

  // Validate applicant data - strict validation for applicants 1 and 2
  const validateApplicant = (applicant: any, applicantNumber: number): string[] => {
    const errors: string[] = [];
    
    // Only validate applicants 1 and 2 strictly
    if (applicantNumber === 1 || applicantNumber === 2) {
      const requiredFields: { [key: string]: string } = {
        title: 'Title',
        name: 'Full Name',
        relation: 'Relation',
        sonWifeDaughterOf: 'Son/Wife/Daughter of',
        nationality: 'Nationality',
        dob: 'Date of Birth',
        age: 'Age',
        profession: 'Profession',
        aadhaar: 'Aadhaar number',
        residentialStatus: 'Residential Status',
        pan: 'PAN number',
        correspondenceAddress: 'Correspondence Address',
        phone: 'Mobile number',
        email: 'Email',
        signature: 'Signature',
      };

      // Check all required fields
      Object.keys(requiredFields).forEach(field => {
        const value = applicant[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${requiredFields[field]} is required for Applicant ${applicantNumber}`);
        }
      });

      // Validate format for filled fields
      if (applicant.aadhaar) {
        const aadhaarDigits = applicant.aadhaar.toString().replace(/\D/g, '');
        if (aadhaarDigits.length !== 12) {
          errors.push(`Invalid Aadhaar number for Applicant ${applicantNumber} (must be exactly 12 digits)`);
        }
      }
      if (applicant.pan && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(applicant.pan)) {
        errors.push(`Invalid PAN number for Applicant ${applicantNumber}`);
      }
      if (applicant.phone && (!/^[6-9]/.test(applicant.phone) || applicant.phone.length !== 10)) {
        errors.push(`Invalid mobile number for Applicant ${applicantNumber} (must start with 6-9 and be 10 digits)`);
      }
      if (applicant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email)) {
        errors.push(`Invalid email address for Applicant ${applicantNumber}`);
      }
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    // Trigger validation in all ApplicantForm components
    setValidationTrigger(prev => prev + 1);
    
    // Wait a bit for validation to complete, then scroll to first error
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Scroll to first error field across all applicants
    // Note: We don't auto-focus to avoid interrupting user typing
    const errorFields = document.querySelectorAll('[data-field-name]');
    for (const field of errorFields) {
      const input = field.querySelector('input, select, textarea') as HTMLElement;
      if (input && (input.classList.contains('border-red-500') || field.querySelector('.text-red-500'))) {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Don't auto-focus to avoid interrupting user typing
        break;
      }
    }
    
    setIsSubmitting(true);
    try {
      // Calculate applicant count
      const applicantCount = formData.applicants.filter(app => app.name && app.name.trim() !== '').length;
      
      if (applicantCount === 0) {
        alert('Please fill at least one applicant form before submitting.');
        setIsSubmitting(false);
        return;
      }

      // Strict validation for applicants 1 and 2
      const validationErrors: string[] = [];
      
      // Validate applicant 1
      if (formData.applicants[0]) {
        const errors1 = validateApplicant(formData.applicants[0], 1);
        validationErrors.push(...errors1);
      }
      
      // Validate applicant 2 if exists
      if (formData.applicants[1] && formData.applicants[1].name && formData.applicants[1].name.trim() !== '') {
        const errors2 = validateApplicant(formData.applicants[1], 2);
        validationErrors.push(...errors2);
      }

      // If there are validation errors, prevent submission (errors are shown in fields)
      if (validationErrors.length > 0) {
        setIsSubmitting(false);
        return;
      }

      // Call API to submit application and generate PDF
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          applicantCount,
          bhkType: formData.bhkType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.applicationId) {
        // Navigate to preview page with the application ID
        window.location.href = `/preview/${result.applicationId}`;
      } else {
        throw new Error(result.error || 'Failed to get application ID');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(`Error submitting application: ${error instanceof Error ? error.message : 'Please try again.'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6">
        <img src="./images/logo-monarch-color.svg" className='w-[250px] mx-auto mb-4' alt="" />
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center text-gray-800 px-2">
          Application Form
        </h1>
        
        <div className="w-full overflow-x-auto">
          <DynamicFormViewer
            pdfUrl="/form.pdf"
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onSubmit={handleSubmit}
            validationTrigger={validationTrigger}
          />
        </div>
        
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-center text-gray-700 font-semibold">Submitting Application...</p>
              <p className="text-center text-sm text-gray-500 mt-2">Please wait while we process your application.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}