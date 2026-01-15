import { ApplicantData } from './types';

/**
 * Check if applicant 3 has any data (name or company fields)
 * This is a client-safe utility function that can be used in client components
 */
export function hasApplicant3Data(applicant: ApplicantData): boolean {
  if (!applicant) return false;
  
  // Check if name exists
  if (applicant.name && applicant.name.trim() !== '') return true;
  
  // Check ALL company/firm/HUF fields (from the "OR" section)
  if (applicant.companyName && applicant.companyName.trim() !== '') return true;
  if (applicant.regOfficeLine1 && applicant.regOfficeLine1.trim() !== '') return true;
  if (applicant.regOfficeLine2 && applicant.regOfficeLine2.trim() !== '') return true;
  if (applicant.authorizedSignatoryLine1 && applicant.authorizedSignatoryLine1.trim() !== '') return true;
  if (applicant.authorizedSignatoryLine2 && applicant.authorizedSignatoryLine2.trim() !== '') return true;
  if (applicant.boardResolutionDate && applicant.boardResolutionDate.trim() !== '') return true;
  if (applicant.companyPanOrTin && applicant.companyPanOrTin.trim() !== '') return true;
  if (applicant.companyTelNo && applicant.companyTelNo.trim() !== '') return true;
  if (applicant.companyMobileNo && applicant.companyMobileNo.trim() !== '') return true;
  if (applicant.companyEmail && applicant.companyEmail.trim() !== '') return true;
  if (applicant.companyFaxNo && applicant.companyFaxNo.trim() !== '') return true;
  
  // Check other common fields (personal details section)
  if (applicant.title && applicant.title.trim() !== '') return true;
  if (applicant.pan && applicant.pan.trim() !== '') return true;
  if (applicant.email && applicant.email.trim() !== '') return true;
  if (applicant.phone && applicant.phone.trim() !== '') return true;
  if (applicant.photograph) return true;
  if (applicant.signature) return true;
  
  return false;
}
