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

  const handleFormDataChange = (data: FormData) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Calculate applicant count
      const applicantCount = formData.applicants.filter(app => app.name && app.name.trim() !== '').length;
      
      if (applicantCount === 0) {
        alert('Please fill at least one applicant form before submitting.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.bhkType) {
        alert('Please select BHK type before submitting.');
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
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center text-gray-800 px-2">
          Suncity Monarch Application Form
        </h1>
        
        <div className="w-full overflow-x-auto">
          <DynamicFormViewer
            pdfUrl="/form.pdf"
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onSubmit={handleSubmit}
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