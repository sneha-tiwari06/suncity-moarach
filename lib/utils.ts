// Validation utilities
export const validateAadhaar = (aadhaar: string): boolean => {
  return /^\d{12}$/.test(aadhaar);
};

export const validatePAN = (pan: string): boolean => {
  return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(pan);
};

export const validatePhone = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Format helpers
export const formatAadhaar = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 12);
};

export const formatPAN = (value: string): string => {
  return value.replace(/[^A-Z0-9]/g, '').slice(0, 10).toUpperCase();
};

export const formatPhone = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};