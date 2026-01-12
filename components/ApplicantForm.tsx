'use client';

import { useState } from 'react';
import { validateAadhaar, validatePAN, validatePhone, validateEmail, formatAadhaar, formatPAN, formatPhone } from '@/lib/utils';
import { ApplicantData } from '@/lib/types';

interface ApplicantFormProps {
  applicantNumber: number;
  data: ApplicantData;
  onChange: (data: ApplicantData) => void;
  canRemove?: boolean;
  onRemove?: () => void;
}

export default function ApplicantForm({
  applicantNumber,
  data,
  onChange,
  canRemove = false,
  onRemove,
}: ApplicantFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleFieldChange = (field: keyof ApplicantData, value: any) => {
    let formattedValue: any = value;

    // Apply formatting
    if (field === 'aadhaar') {
      formattedValue = formatAadhaar(value);
    } else if (field === 'pan') {
      formattedValue = formatPAN(value);
    } else if (field === 'phone' || field === 'telNo') {
      formattedValue = formatPhone(value);
    } else if (field === 'age') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    } else if (field === 'pincode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    // Validate
    const error = validateField(field, formattedValue);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Update parent
    onChange({
      ...data,
      [field]: formattedValue,
    });
  };

  const validateField = (field: keyof ApplicantData, value: any): string => {
    if (field === 'aadhaar' && value && !validateAadhaar(value)) {
      return 'Invalid Aadhaar number (must be 12 digits)';
    }
    if (field === 'pan' && value && !validatePAN(value)) {
      return 'Invalid PAN number (format: ABCDE1234F)';
    }
    if ((field === 'phone' || field === 'telNo') && value && !validatePhone(value)) {
      return 'Invalid phone number (must be 10 digits)';
    }
    if (field === 'email' && value && !validateEmail(value)) {
      return 'Invalid email address';
    }
    return '';
  };

  const handlePhotographUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleFieldChange('photograph', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Store signature in applicant's data
        handleFieldChange('signature', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6">
      <div className="mb-4 pb-3 border-b-2 border-gray-300 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">
          Applicant {applicantNumber} Details
        </h2>
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors font-medium"
          >
            Remove Applicant
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column - Form Fields */}
        <div className="md:col-span-2 space-y-4">
          {/* Title */}
          <div>            
            <select
              value={data.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Title</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="M/s.">M/s.</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
              maxLength={50}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Son/Wife/Daughter of */}
          <div>
          <select
              value={data.relation || ''}
              onChange={(e) => handleFieldChange('relation', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.relation ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Relation</option>
              <option value="son">Son of</option>
              <option value="daughter">Daughter of</option>
              <option value="wife">Wife of</option>
            </select>
            </div>
            <div>
            <input
              type="text"
              value={data.sonWifeDaughterOf || ''}
              onChange={(e) => handleFieldChange('sonWifeDaughterOf', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sonWifeDaughterOf ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter relationship and name"
              maxLength={50}
            />
            {errors.sonWifeDaughterOf && <p className="mt-1 text-sm text-red-500">{errors.sonWifeDaughterOf}</p>}
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nationality <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.nationality || ''}
              onChange={(e) => handleFieldChange('nationality', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nationality ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter nationality"
              maxLength={30}
            />
          </div>

          {/* Age and DOB in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.age || ''}
                onChange={(e) => handleFieldChange('age', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter age"
                maxLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (DOB) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={data.dob || ''}
                onChange={(e) => handleFieldChange('dob', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dob ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profession <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.profession || ''}
              onChange={(e) => handleFieldChange('profession', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.profession ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter profession"
              maxLength={50}
            />
          </div>

          {/* Aadhaar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhaar No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.aadhaar || ''}
              onChange={(e) => handleFieldChange('aadhaar', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.aadhaar ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter 12-digit Aadhaar"
              maxLength={12}
            />
            {errors.aadhaar && <p className="mt-1 text-sm text-red-500">{errors.aadhaar}</p>}
          </div>

          {/* Residential Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Residential Status <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`residentialStatus_${applicantNumber}`}
                  value="Resident"
                  checked={data.residentialStatus === 'Resident'}
                  onChange={(e) => handleFieldChange('residentialStatus', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Resident</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`residentialStatus_${applicantNumber}`}
                  value="Non-Resident"
                  checked={data.residentialStatus === 'Non-Resident'}
                  onChange={(e) => handleFieldChange('residentialStatus', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Non-Resident</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`residentialStatus_${applicantNumber}`}
                  value="Foreign National of Indian Origin"
                  checked={data.residentialStatus === 'Foreign National of Indian Origin'}
                  onChange={(e) => handleFieldChange('residentialStatus', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Foreign National of Indian Origin</span>
              </label>
            </div>
          </div>

          {/* PAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income Tax Permanent Account No. (PAN) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.pan || ''}
              onChange={(e) => handleFieldChange('pan', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
                errors.pan ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            {errors.pan && <p className="mt-1 text-sm text-red-500">{errors.pan}</p>}
          </div>

          {/* IT Ward/Circle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ward / Circle / Special Range / Place, where assessed to income tax
            </label>
            <input
              type="text"
              value={data.itWard || ''}
              onChange={(e) => handleFieldChange('itWard', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IT assessment details"
              maxLength={50}
            />
          </div>

          {/* Correspondence Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correspondence Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={data.correspondenceAddress || ''}
              onChange={(e) => handleFieldChange('correspondenceAddress', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter correspondence address (line 1)"
            />
            {errors.correspondenceAddress && <p className="mt-1 text-sm text-red-500">{errors.correspondenceAddress}</p>}
          </div>

          {/* Contact Details - Tel No., Mobile, Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tel No. (Landline)
              </label>
              <input
                type="tel"
                value={data.telNo || ''}
                onChange={(e) => handleFieldChange('telNo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telNo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter landline number"
                maxLength={15}
              />
              {errors.telNo && <p className="mt-1 text-sm text-red-500">{errors.telNo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail ID <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>
        </div>

        {/* Right Column - Photo Upload */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Affix Photograph <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 bg-gray-50 min-h-[250px] flex flex-col items-center justify-center relative">
              {data.photograph ? (
                <div className="w-full h-full flex flex-col items-center">
                  <img
                    src={data.photograph}
                    alt="Applicant Photo"
                    className="w-full h-auto max-h-[200px] object-contain rounded mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('photograph', '')}
                    className="w-full px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotographUpload}
                    className="hidden"
                    id={`photo-upload-${applicantNumber}`}
                  />
                  <label
                    htmlFor={`photo-upload-${applicantNumber}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer transition-colors inline-block"
                  >
                    Upload Photo
                  </label>
                  <p className="mt-2 text-xs text-gray-500 text-center">JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signature Upload - Each applicant has their own signature */}
        <div className="md:col-span-3 border-t-2 border-gray-300 pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Signature <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-500">(Applicant {applicantNumber} signature - applies to all signature fields for this applicant)</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {data.signature && (
              <div className="w-40 h-20 border-2 border-gray-300 rounded overflow-hidden bg-white flex-shrink-0">
                <img
                  src={data.signature}
                  alt={`Applicant ${applicantNumber} Signature`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
          {!data.signature && (
            <p className="mt-1 text-sm text-gray-500">
              Upload signature image (JPG, PNG) - This signature will be applied to all signature fields for Applicant {applicantNumber} across all pages
            </p>
          )}
          {data.signature && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✓ Signature uploaded for Applicant {applicantNumber} - Will be applied to all signature fields for this applicant
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
