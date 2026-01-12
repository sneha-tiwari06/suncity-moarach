// Form data types

export interface ApplicantData {
  // Personal Details
  title?: string; // Mr./Mrs./Ms./M/s.
  name?: string;
  relation?: string; // Son/Wife/Daughter of
  sonWifeDaughterOf?: string; // Son/Wife/Daughter of
  nationality?: string;
  age?: string;
  dob?: string; // Date of Birth
  profession?: string;
  aadhaar?: string;
  photograph?: string; // Base64 encoded image
  
  // Residential Status
  residentialStatus?: 'Resident' | 'Non-Resident' | 'Foreign National of Indian Origin' | '';
  
  // Income Tax Details
  pan?: string; // Income Tax Permanent Account No.
  itWard?: string; // Ward/Circle/Special Range/Place where assessed to income tax
  
  // Address Details
  correspondenceAddress?: string; // Correspondence Address (separate from residential)
  address?: string; // Residential Address
  city?: string;
  state?: string;
  pincode?: string;
  
  // Contact Details
  telNo?: string; // Landline/Tel No.
  phone?: string; // Mobile
  email?: string; // E-Mail ID
  
  // Signature - Each applicant has their own signature
  signature?: string; // Base64 encoded signature image
  
  [key: string]: any; // For additional fields
}

export interface FormData {
  applicants: ApplicantData[];
  bhkType: '3bhk' | '4bhk' | string;
  unitNumber?: string;
  // Note: Signatures are now stored per applicant in ApplicantData.signature
  
  // Apartment Details
  tower?: string;
  apartmentNumber?: string;
  floor?: string;
  carpetAreaSqm?: string;
  carpetAreaSqft?: string;
  unitPrice?: string;
  totalPrice?: string;
  basePrice?: string;
  gstAmount?: string;
  
  // Declaration
  declarationDate?: string;
  declarationPlace?: string;
  
  [key: string]: any;
}

export interface ApplicationSubmission {
  formData: FormData;
  applicantCount: number;
  bhkType: string;
}
