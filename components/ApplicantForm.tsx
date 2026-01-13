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

  // Calculate age from date of birth
  const calculateAge = (dob: string): string => {
    if (!dob) return '';

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age > 0 ? age.toString() : '';
  };

  // Helper function to capitalize first letter of each word
  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return str;
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleFieldChange = (field: keyof ApplicantData, value: any) => {
    let formattedValue: any = value;

    // Apply formatting
    if (field === 'aadhaar') {
      formattedValue = formatAadhaar(value);
    } else if (field === 'pan') {
      formattedValue = formatPAN(value);
    } else if (field === 'phone' || field === 'telNo' || field === 'companyTelNo' || field === 'companyMobileNo') {
      formattedValue = formatPhone(value);
    } else if (field === 'age') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    } else if (field === 'pincode') {
      formattedValue = value.replace(/\D/g, '').slice(0, 6);
    } else if (field === 'dob') {
      // Auto-calculate age when DOB changes
      const calculatedAge = calculateAge(value);
      if (calculatedAge) {
        // Update both DOB and age
        const updatedData = {
          ...data,
          dob: value,
          age: calculatedAge,
        };

        // Validate both fields
        const dobError = validateField('dob', value);
        const ageError = validateField('age', calculatedAge);

        setErrors(prev => {
          const newErrors = { ...prev };
          if (dobError) {
            newErrors.dob = dobError;
          } else {
            delete newErrors.dob;
          }
          if (ageError) {
            newErrors.age = ageError;
          } else {
            delete newErrors.age;
          }
          return newErrors;
        });

        onChange(updatedData);
        return;
      }
    } else if (
      // Fields that should have first letter capitalized
      field === 'name' ||
      field === 'sonWifeDaughterOf' ||
      field === 'nationality' ||
      field === 'profession' ||
      field === 'city' ||
      field === 'state' ||
      field === 'itWard' ||
      field === 'correspondenceAddress' ||
      field === 'address' ||
      field === 'companyName' ||
      field === 'regOfficeLine1' ||
      field === 'regOfficeLine2' ||
      field === 'authorizedSignatoryLine1' ||
      field === 'authorizedSignatoryLine2' ||
      field === 'boardResolutionDate'
    ) {
      // Capitalize first letter of each word for text fields
      formattedValue = capitalizeFirstLetter(value);
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

  // Validate field on blur (when user leaves the field)
  const handleFieldBlur = (field: keyof ApplicantData) => {
    if (applicantNumber === 1 || applicantNumber === 2) {
      const value = data[field];
      const error = validateField(field, value);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };
  const validatePhone = (phone: any) => {
    return /^[6-9]\d{9}$/.test(phone);
  };
  const validateField = (field: keyof ApplicantData, value: any): string => {
    // Strict validation for applicants 1 and 2 - all fields are required
    if (applicantNumber === 1 || applicantNumber === 2) {
      // Required fields validation
      const requiredFields: { [key: string]: string } = {
        title: 'Title is required',
        name: 'Full Name is required',
        relation: 'Relation is required',
        sonWifeDaughterOf: 'Son/Wife/Daughter of is required',
        nationality: 'Nationality is required',
        dob: 'Date of Birth is required',
        age: 'Age is required',
        profession: 'Profession is required',
        residentialStatus: 'Residential Status is required',
        pan: 'PAN number is required',
        correspondenceAddress: 'Correspondence Address is required',
        phone: 'Mobile number is required',
        email: 'Email is required',
        signature: 'Signature is required',
      };

      // Check if field is required and empty
      if (requiredFields[field] && (!value || (typeof value === 'string' && value.trim() === ''))) {
        return requiredFields[field];
      }
    }

    // Format validation (only if value exists)
    if (field === 'aadhaar' && value) {
      // Remove all non-digits before validation to handle any formatting
      const digitsOnly = value.toString().replace(/\D/g, '');
      if (digitsOnly.length !== 12) {
        return 'Invalid Aadhaar number (must be exactly 12 digits)';
      }
      // Additional validation using the utility function
      if (!validateAadhaar(digitsOnly)) {
        return 'Invalid Aadhaar number (must be exactly 12 digits)';
      }
    }
    if (field === 'pan' && value) {
      if (!validatePAN(value)) {
        return 'Invalid PAN number (format: ABCDE1234F)';
      }
    }
    if (field === 'phone' && value) {
      if (!/^[6-9]/.test(value)) {
        return 'Phone number must start with 6, 7, 8, or 9.';
      }
      if (!/^\d+$/.test(value)) {
        return 'Phone number must contain only digits.';
      }
      if (value.length !== 10) {
        return 'Phone number must be exactly 10 digits.';
      }
    }
    if (field === 'telNo' && value) {
      if (value.length < 6 || value.length > 12) {
        return 'Phone number must be between 6 and 12 digits.';
      }
    }
    if (field === 'companyMobileNo' && value) {
      if (!/^[6-9]/.test(value)) {
        return 'Phone number must start with 6, 7, 8, or 9.';
      }
      if (!/^\d+$/.test(value)) {
        return 'Phone number must contain only digits.';
      }
      if (value.length !== 10) {
        return 'Phone number must be exactly 10 digits.';
      }
    }
    if (field === 'companyTelNo' && value) {
      if (value.length < 6 || value.length > 12) {
        return 'Phone number must be between 6 and 12 digits.';
      }
    }
    if ((field === 'email' || field === 'companyEmail') && value) {
      if (!validateEmail(value)) {
        return 'Invalid email address';
      }
    }
    return '';
  };

  const handlePhotographUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (150KB = 150 * 1024 bytes)
    const maxSize = 300 * 1024; // 150KB in bytes
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, photograph: 'Photo size must be 300KB or less' }));
      event.target.value = ''; // Reset input
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photograph: 'Please upload a valid image file' }));
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Validate passport size: square aspect ratio (1:1) with reasonable dimensions
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.photograph;
          return newErrors;
        });

        const base64String = reader.result as string;
        handleFieldChange('photograph', base64String);
      };
      img.onerror = () => {
        setErrors(prev => ({ ...prev, photograph: 'Failed to load image' }));
        event.target.value = '';
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setErrors(prev => ({ ...prev, photograph: 'Failed to read file' }));
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (200KB = 200 * 1024 bytes)
      const maxSize = 200 * 1024; // 200KB in bytes
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          signature: `File size exceeds 200KB. Please upload a smaller file. (Current: ${(file.size / 1024).toFixed(2)}KB)`
        }));
        // Reset the input
        event.target.value = '';
        return;
      }

      // Clear any previous signature errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.signature;
        return newErrors;
      });

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
    <div className="mb-6">
      <div className="mb-4 pb-3 border-b-2 border-gray-300 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 uppercase">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <select
              value={data.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              onBlur={() => handleFieldBlur('title')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select Title</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="M/s.">M/s.</option>
            </select>
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
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
              onBlur={() => handleFieldBlur('name')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter full name"
              maxLength={50}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Son/Wife/Daughter of */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation <span className="text-red-500">*</span>
            </label>
            <select
              value={data.relation || ''}
              onChange={(e) => handleFieldChange('relation', e.target.value)}
              onBlur={() => handleFieldBlur('relation')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.relation ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select Relation</option>
              <option value="Son of">Son of</option>
              <option value="Daughter of">Daughter of</option>
              <option value="Wife of">Wife of</option>
            </select>
            {errors.relation && <p className="mt-1 text-sm text-red-500">{errors.relation}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Son/Wife/Daughter of <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.sonWifeDaughterOf || ''}
              onChange={(e) => handleFieldChange('sonWifeDaughterOf', e.target.value)}
              onBlur={() => handleFieldBlur('sonWifeDaughterOf')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sonWifeDaughterOf ? 'border-red-500' : 'border-gray-300'
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
              onBlur={() => handleFieldBlur('nationality')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nationality ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter nationality"
              maxLength={30}
            />
            {errors.nationality && <p className="mt-1 text-sm text-red-500">{errors.nationality}</p>}
          </div>

          {/* Age and DOB in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (DOB) <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                value={data.dob || ''}
                max={new Date(
                  new Date().setFullYear(new Date().getFullYear() - 18)
                )
                  .toISOString()
                  .split('T')[0]}
                onChange={(e) => handleFieldChange('dob', e.target.value)}
                onBlur={() => handleFieldBlur('dob')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dob ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.dob && <p className="mt-1 text-sm text-red-500">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.age || ''}
                onChange={(e) => handleFieldChange('age', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter age in years"
                readOnly
                maxLength={3}
              />
              {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age}</p>}
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
              onBlur={() => handleFieldBlur('profession')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.profession ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter profession"
              maxLength={50}
            />
            {errors.profession && <p className="mt-1 text-sm text-red-500">{errors.profession}</p>}
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
            
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.aadhaar ? 'border-red-500' : 'border-gray-300'
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
            <div className={`flex items-center gap-4 p-3 rounded-md ${errors.residentialStatus ? 'border-2 border-red-500 bg-red-50' : ''}`}>
              <label className="flex items-center whitespace-nowrap">
                <input
                  type="radio"
                  name={`residentialStatus_${applicantNumber}`}
                  value="Resident"
                  checked={data.residentialStatus === 'Resident'}
                  onChange={(e) => handleFieldChange('residentialStatus', e.target.value)}
                  onBlur={() => handleFieldBlur('residentialStatus')}
                  className="mr-2"
                />
                <span className="text-sm">Resident</span>
              </label>

              <label className="flex items-center whitespace-nowrap">
                <input
                  type="radio"
                  name={`residentialStatus_${applicantNumber}`}
                  value="Non-Resident"
                  checked={data.residentialStatus === 'Non-Resident'}
                  onChange={(e) => handleFieldChange('residentialStatus', e.target.value)}
                  onBlur={() => handleFieldBlur('residentialStatus')}
                  className="mr-2"
                />
                <span className="text-sm">Non-Resident</span>
              </label>

              <label className="flex items-center whitespace-nowrap">
                <input
                  type="radio"
                  name={`residentialStatus_${applicantNumber}`}
                  value="Foreign National of Indian Origin"
                  checked={data.residentialStatus === 'Foreign National of Indian Origin'}
                  onChange={(e) => handleFieldChange('residentialStatus', e.target.value)}
                  onBlur={() => handleFieldBlur('residentialStatus')}
                  className="mr-2"
                />
                <span className="text-sm">Foreign National of Indian Origin</span>
              </label>
            </div>
            {errors.residentialStatus && <p className="mt-1 text-sm text-red-500">{errors.residentialStatus}</p>}
          </div>

          {/* PAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Income Tax Permanent Account No. (PAN) <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={data.pan || ''}
              onChange={(e) =>
                handleFieldChange('pan', e.target.value.toUpperCase())
              }
              onBlur={() => handleFieldBlur('pan')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.pan ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="ABCDE1234F"
              maxLength={10}
            />

            {errors.pan && (
              <p className="mt-1 text-sm text-red-500">{errors.pan}</p>
            )}
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
              onBlur={() => handleFieldBlur('correspondenceAddress')}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.correspondenceAddress ? 'border-red-500' : 'border-gray-300'}`}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.telNo ? 'border-red-500' : 'border-gray-300'
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
                onBlur={() => handleFieldBlur('phone')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
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
              onBlur={() => handleFieldBlur('email')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Company/Firm/HUF Fields - Only for Third Applicant */}
          {applicantNumber === 3 && (
            <>
              <div className="mt-8 pt-6 border-t-4 border-gray-400">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">OR</h3>
                  <p className="text-sm text-gray-600 italic mb-4">
                    [If the allottee is company, firm, HUF, association / society]
                  </p>
                </div>

                {/* M/s. */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    M/s.
                  </label>
                  <input
                    type="text"
                    value={data.companyName || ''}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company/firm name"
                    maxLength={100}
                  />
                </div>

                {/* Reg. Office/Corporate Office */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reg. Office/Corporate Office
                  </label>
                  <textarea
                    value={data.regOfficeLine1 || ''}
                    onChange={(e) => handleFieldChange('regOfficeLine1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Line 1"
                    maxLength={100}
                  />
                </div>

                {/* Authorized Signatory */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authorized Signatory
                  </label>
                  <textarea
                   
                    value={data.authorizedSignatoryLine1 || ''}
                    onChange={(e) => handleFieldChange('authorizedSignatoryLine1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Line 1"
                    maxLength={100}
                  />
                </div>

                {/* Board Resolution dated/Power of Attorney */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board Resolution dated/Power of Attorney
                  </label>
                  <input
                    type="text"
                    value={data.boardResolutionDate || ''}
                    onChange={(e) => handleFieldChange('boardResolutionDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter date or reference"
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    (attach a certified true copy of the Board Resolution/Power of Attorney)
                  </p>
                </div>

                {/* PAN No./TIN No. */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN No./TIN No.
                  </label>
                  <input
                    type="text"
                    value={data.companyPanOrTin || ''}
                    onChange={(e) => handleFieldChange('companyPanOrTin', e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyPanOrTin ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter PAN or TIN number"
                    maxLength={20}
                  />
                  {errors.companyPanOrTin && <p className="mt-1 text-sm text-red-500">{errors.companyPanOrTin}</p>}
                </div>

                {/* Tel No. and Mobile No. */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tel No.
                    </label>
                    <input
                      type="tel"
                      value={data.companyTelNo || ''}
                      onChange={(e) => handleFieldChange('companyTelNo', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyTelNo ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Enter telephone number"
                      maxLength={15}
                    />
                    {errors.companyTelNo && <p className="mt-1 text-sm text-red-500">{errors.companyTelNo}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile No.
                    </label>
                    <input
                      type="tel"
                      value={data.companyMobileNo || ''}
                      onChange={(e) => handleFieldChange('companyMobileNo', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyMobileNo ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Enter mobile number"
                      maxLength={10}
                    />
                    {errors.companyMobileNo && <p className="mt-1 text-sm text-red-500">{errors.companyMobileNo}</p>}
                  </div>
                </div>

                {/* E-mail ID and Fax No. */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail ID
                    </label>
                    <input
                      type="email"
                      value={data.companyEmail || ''}
                      onChange={(e) => handleFieldChange('companyEmail', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyEmail ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Enter email address"
                    />
                    {errors.companyEmail && <p className="mt-1 text-sm text-red-500">{errors.companyEmail}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax No.
                    </label>
                    <input
                      type="tel"
                      value={data.companyFaxNo || ''}
                      onChange={(e) => handleFieldChange('companyFaxNo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter fax number"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Photo Upload */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Affix Photograph <span className="text-red-500">*</span>
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 bg-gray-50 min-h-[250px] flex flex-col items-center justify-center relative ${errors.photograph ? 'border-red-400' : 'border-gray-400'}`}>
              {data.photograph ? (
                <div className="w-full h-full flex flex-col items-center">
                  <img
                    src={data.photograph}
                    alt="Applicant Photo"
                    className="w-full h-auto max-h-[200px] object-contain rounded mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange('photograph', '');
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.photograph;
                        return newErrors;
                      });
                    }}
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
                  <p className="mt-2 text-xs text-gray-500 text-center">JPG, PNG (Max 300KB, Passport Size)</p>
                  {errors.photograph && <p className="mt-2 text-xs text-red-500 text-center">{errors.photograph}</p>}
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
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.signature ? 'border border-red-500 rounded' : ''}`}
              />
            </div>
            {data.signature && (
              <div className={`w-40 h-20 border-2 rounded overflow-hidden bg-white flex-shrink-0 ${errors.signature ? 'border-red-500' : 'border-gray-300'}`}>
                <img
                  src={data.signature}
                  alt={`Applicant ${applicantNumber} Signature`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            {!data.signature && (applicantNumber === 1 || applicantNumber === 2) && errors.signature && (
              <div className={`w-40 h-20 border-2 border-red-500 border-dashed rounded overflow-hidden bg-red-50 flex-shrink-0 flex items-center justify-center`}>
                <span className="text-red-500 text-xs text-center px-2">Signature Required</span>
              </div>
            )}
          </div>
          {!data.signature && !errors.signature && (
            <p className="mt-1 text-sm text-gray-500">
              Upload signature image (JPG, PNG, Max 200KB) - This signature will be applied to all signature fields for Applicant {applicantNumber} across all pages
            </p>
          )}
          {errors.signature && (
            <p className="mt-1 text-sm text-red-500">{errors.signature}</p>
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
