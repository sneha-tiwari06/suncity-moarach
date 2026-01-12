'use client';

import { useState, useEffect } from 'react';
import { FormData } from '@/lib/types';

interface ApartmentDeclarationFormProps {
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: () => void;
}

// Preset carpet areas and unit prices based on BHK type
const CARPET_AREAS = {
  '3bhk': {
    sqm: 121.41,
    sqft: 1306.77, // Calculated: 121.41 * 10.764
    unitPrice: 50000, // Preset unit price per sqm for 3 BHK (in rupees)
  },
  '4bhk': {
    sqm: 167.23,
    sqft: 1800.04, // Calculated: 167.23 * 10.764
    unitPrice: 60000, // Preset unit price per sqm for 4 BHK (in rupees)
  },
} as const;

// Conversion factor: 1 sqm = 10.764 sqft
const SQM_TO_SQFT = 10.764;

export default function ApartmentDeclarationForm({
  formData,
  onFormDataChange,
  onSubmit,
}: ApartmentDeclarationFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    // Set today's date in YYYY-MM-DD format
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setTodayDate(dateStr);
    
    // Auto-fill date if not already set
    if (!formData.declarationDate) {
      handleFieldChange('declarationDate', dateStr);
    }
  }, []);

  // Auto-set carpet area and unit price when BHK type changes
  useEffect(() => {
    if (formData.bhkType && (formData.bhkType === '3bhk' || formData.bhkType === '4bhk')) {
      const preset = CARPET_AREAS[formData.bhkType as keyof typeof CARPET_AREAS];
      const updatedFormData = { ...formData };
      
      let needsUpdate = false;
      
      // Update carpet area (only if different to prevent infinite loop)
      if (formData.carpetAreaSqm !== preset.sqm.toString()) {
        updatedFormData.carpetAreaSqm = preset.sqm.toString();
        updatedFormData.carpetAreaSqft = preset.sqft.toString();
        needsUpdate = true;
      }
      
      // Update unit price (preset based on BHK type) - only if different
      if (formData.unitPrice !== preset.unitPrice.toString()) {
        updatedFormData.unitPrice = preset.unitPrice.toString();
        needsUpdate = true;
      }
      
      // Calculate total price if both unit price and carpet area are set
      const unitPrice = parseFloat(updatedFormData.unitPrice || formData.unitPrice || '0');
      const carpetArea = parseFloat(updatedFormData.carpetAreaSqm || formData.carpetAreaSqm || '0');
      
      if (unitPrice > 0 && carpetArea > 0) {
        const basePrice = unitPrice * carpetArea;
        const gst = basePrice * 0.05; // 5% GST
        const totalPrice = basePrice + gst;
        
        // Check if calculated values have changed
        const newBasePrice = basePrice.toFixed(2);
        const newGstAmount = gst.toFixed(2);
        const newTotalPrice = totalPrice.toFixed(2);
        
        if (formData.basePrice !== newBasePrice || formData.gstAmount !== newGstAmount || formData.totalPrice !== newTotalPrice) {
          updatedFormData.basePrice = newBasePrice;
          updatedFormData.gstAmount = newGstAmount;
          updatedFormData.totalPrice = newTotalPrice;
          needsUpdate = true;
        }
      }
      
      // Only update if something changed
      if (needsUpdate) {
        onFormDataChange(updatedFormData);
      }
    }
  }, [formData.bhkType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = (field: string, value: any) => {
    // Prevent manual changes to unit price (it's preset based on BHK type)
    if (field === 'unitPrice') {
      return; // Unit price is readonly, don't allow manual changes
    }
    
    const updatedFormData = { ...formData };
    
    // Calculate total price when carpet area changes (unit price is preset)
    if (field === 'carpetAreaSqm') {
      const unitPrice = parseFloat(formData.unitPrice || '0');
      const carpetArea = parseFloat(value) || 0;
      
      if (unitPrice > 0 && carpetArea > 0) {
        const basePrice = unitPrice * carpetArea;
        // GST is 5% as per the form
        const gst = basePrice * 0.05;
        const totalPrice = basePrice + gst;
        
        updatedFormData.totalPrice = totalPrice.toFixed(2);
        updatedFormData.basePrice = basePrice.toFixed(2);
        updatedFormData.gstAmount = gst.toFixed(2);
      }
    }

    updatedFormData[field] = value;
    
    // Validate
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

    onFormDataChange(updatedFormData);
  };

  const validateField = (field: string, value: any): string => {
    if (field === 'tower' && !value) {
      return 'Tower is required';
    }
    if (field === 'apartmentNumber' && !value) {
      return 'Apartment Number is required';
    }
    if (field === 'bhkType' && !value) {
      return 'Type (BHK) is required';
    }
    if (field === 'floor' && !value) {
      return 'Floor is required';
    }
    // Unit price is preset based on BHK type, no validation needed
    // if (field === 'unitPrice' && (!value || parseFloat(value) <= 0)) {
    //   return 'Valid Unit Price is required';
    // }
    if (field === 'declarationPlace' && !value) {
      return 'Place is required';
    }
    return '';
  };

  const calculateRatePerSqm = (): string => {
    if (!formData.unitPrice || !formData.carpetAreaSqm) return '0.00';
    const rate = parseFloat(formData.unitPrice) || 0;
    return rate.toFixed(2);
  };

  const handleSubmit = () => {
    // Validate all required fields
    const requiredFields = ['tower', 'apartmentNumber', 'bhkType', 'floor', 'declarationPlace'];
    // Note: unitPrice is preset based on bhkType, so no need to validate separately
    const newErrors: { [key: string]: string } = {};
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit if all valid
    onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Section 4: DETAILS OF THE SAID APARTMENT AND ITS PRICING */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          4. DETAILS OF THE SAID APARTMENT AND ITS PRICING
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Tower */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tower <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tower || ''}
                onChange={(e) => handleFieldChange('tower', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tower ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Tower</option>
                <option value="Altair">Altair</option>
                <option value="Crown">Crown</option>
                <option value="Imperial">Imperial</option>
                <option value="Majestic">Majestic</option>
                <option value="Regalia">Regalia</option>
              </select>
              {errors.tower && <p className="mt-1 text-sm text-red-500">{errors.tower}</p>}
            </div>

            {/* Apartment Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartment No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.apartmentNumber || ''}
                onChange={(e) => handleFieldChange('apartmentNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apartmentNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter apartment number"
              />
              {errors.apartmentNumber && <p className="mt-1 text-sm text-red-500">{errors.apartmentNumber}</p>}
            </div>

            {/* Type (BHK) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bhkType || ''}
                onChange={(e) => handleFieldChange('bhkType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bhkType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Type</option>
                <option value="3bhk">3 BHK</option>
                <option value="4bhk">4 BHK</option>
              </select>
              {errors.bhkType && <p className="mt-1 text-sm text-red-500">{errors.bhkType}</p>}
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.floor || ''}
                onChange={(e) => handleFieldChange('floor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.floor ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Floor</option>
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
                <option value="6th Floor">6th Floor</option>
                <option value="7th Floor">7th Floor</option>
                <option value="8th Floor">8th Floor</option>
                <option value="9th Floor">9th Floor</option>
                <option value="10th Floor">10th Floor</option>
              </select>
              {errors.floor && <p className="mt-1 text-sm text-red-500">{errors.floor}</p>}
            </div>

            {/* Carpet Area */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carpet Area (sq. meter) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.carpetAreaSqm || ''}
                  onChange={(e) => {
                    const sqm = parseFloat(e.target.value) || 0;
                    const sqft = sqm * SQM_TO_SQFT;
                    handleFieldChange('carpetAreaSqm', sqm.toString());
                    handleFieldChange('carpetAreaSqft', sqft.toFixed(2));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  readOnly={!!formData.bhkType}
                />
                {formData.bhkType && (
                  <p className="mt-1 text-xs text-gray-500">Auto-filled based on BHK type</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carpet Area (sq. feet) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.carpetAreaSqft || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-500">Auto-calculated</p>
              </div>
            </div>

            {/* Unit Price - Preset based on BHK type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (in rupees) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.unitPrice ? `₹ ${parseFloat(formData.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹ 0.00'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
              />
              {formData.bhkType && (
                <p className="mt-1 text-xs text-gray-500">
                  Auto-filled based on BHK type ({formData.bhkType === '3bhk' ? '3 BHK' : '4 BHK'})
                </p>
              )}
              {!formData.bhkType && (
                <p className="mt-1 text-xs text-gray-500">
                  Select BHK type to auto-fill unit price
                </p>
              )}
            </div>

            {/* GST Note */}
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
              <p>
                <strong>Note:</strong> Applicable taxes and cesses payable by the Applicant(s) which are in addition to total unit price 
                (this includes GST payable at rates as specified from time to time, which at present is <strong>5%</strong>)
              </p>
            </div>

            {/* Total Price */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Price (in rupees) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.totalPrice ? `₹ ${parseFloat(formData.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold text-lg"
              />
              {formData.basePrice && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Base Price: ₹ {parseFloat(formData.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p>GST (5%): ₹ {parseFloat(formData.gstAmount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate of Said Apartment per square meter*
              </label>
              <input
                type="text"
                value={calculateRatePerSqm() ? `₹ ${parseFloat(calculateRatePerSqm()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹ 0.00'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
              />
            </div>

            {/* Notes */}
            <div className="mt-6 text-xs text-gray-600 space-y-2 bg-yellow-50 p-4 rounded border border-yellow-200">
              <p>
                <strong>*NOTE:</strong>
              </p>
              <p>
                1. The <strong>Total Price</strong> for the <strong>Said Apartment</strong> is based on the <strong>Carpet Area</strong>.
              </p>
              <p>
                2. The <strong>Promoter</strong> has taken the conversion factor of 10.764 sq.ft. per sqm. for the purpose of this 
                <strong> Application</strong> (1 feet = 304.8 mm)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: DECLARATION */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          5. DECLARATION
        </h3>

        <div className="space-y-4">
          {/* Declaration Text */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              The <strong>Applicant(s)</strong> hereby declares that the above particulars / information given by the <strong>Applicant(s)</strong> are true and correct and nothing has been concealed therefrom.
            </p>
          </div>

          {/* Yours Faithfully */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700">Yours Faithfully</p>
          </div>

          {/* Date and Place */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.declarationDate || todayDate}
                onChange={(e) => handleFieldChange('declarationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Auto-filled with today's date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Place <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.declarationPlace || ''}
                onChange={(e) => handleFieldChange('declarationPlace', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.declarationPlace ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter place"
              />
              {errors.declarationPlace && <p className="mt-1 text-sm text-red-500">{errors.declarationPlace}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg shadow-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}
