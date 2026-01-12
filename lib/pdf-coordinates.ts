/**
 * PDF Field Coordinates Mapping
 * 
 * These coordinates are measured from the PDF's coordinate system (bottom-left origin)
 * Values are in points (1/72 inch)
 * 
 * IMPORTANT: These coordinates need to be calibrated based on the actual PDF layout
 * Use PDF annotation tools or pdf-lib measurement to get exact positions
 */

export interface FieldCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontName?: string;
}

export interface PageFields {
  [fieldName: string]: FieldCoordinate;
}

export interface FormCoordinates {
  [pageNumber: number]: PageFields;
}

// Page 5 coordinates - Applicant 1 Personal Details
export const page5Fields: PageFields = {
  applicant1Name: { x: 100, y: 700, width: 200, height: 15, fontSize: 10 },
  applicant1FatherName: { x: 100, y: 680, width: 200, height: 15, fontSize: 10 },
  applicant1Address: { x: 100, y: 650, width: 400, height: 50, fontSize: 10 },
  applicant1City: { x: 100, y: 620, width: 150, height: 15, fontSize: 10 },
  applicant1State: { x: 300, y: 620, width: 150, height: 15, fontSize: 10 },
  applicant1Pincode: { x: 100, y: 590, width: 100, height: 15, fontSize: 10 },
  applicant1Phone: { x: 250, y: 590, width: 150, height: 15, fontSize: 10 },
  applicant1Email: { x: 100, y: 560, width: 250, height: 15, fontSize: 10 },
  applicant1Pan: { x: 100, y: 530, width: 150, height: 15, fontSize: 10 },
  applicant1Aadhaar: { x: 100, y: 500, width: 200, height: 15, fontSize: 10 },
  // Add more fields as needed based on actual PDF
};

// Page 6 coordinates - Applicant 2 Personal Details (if applicable)
export const page6Fields: PageFields = {
  applicant2Name: { x: 100, y: 700, width: 200, height: 15, fontSize: 10 },
  applicant2FatherName: { x: 100, y: 680, width: 200, height: 15, fontSize: 10 },
  applicant2Address: { x: 100, y: 650, width: 400, height: 50, fontSize: 10 },
  applicant2City: { x: 100, y: 620, width: 150, height: 15, fontSize: 10 },
  applicant2State: { x: 300, y: 620, width: 150, height: 15, fontSize: 10 },
  applicant2Pincode: { x: 100, y: 590, width: 100, height: 15, fontSize: 10 },
  applicant2Phone: { x: 250, y: 590, width: 150, height: 15, fontSize: 10 },
  applicant2Email: { x: 100, y: 560, width: 250, height: 15, fontSize: 10 },
  applicant2Pan: { x: 100, y: 530, width: 150, height: 15, fontSize: 10 },
  applicant2Aadhaar: { x: 100, y: 500, width: 200, height: 15, fontSize: 10 },
  // Add more fields as needed
};

// Page 7 coordinates - Applicant 3 Personal Details (if applicable)
export const page7Fields: PageFields = {
  applicant3Name: { x: 100, y: 700, width: 200, height: 15, fontSize: 10 },
  applicant3FatherName: { x: 100, y: 680, width: 200, height: 15, fontSize: 10 },
  applicant3Address: { x: 100, y: 650, width: 400, height: 50, fontSize: 10 },
  applicant3City: { x: 100, y: 620, width: 150, height: 15, fontSize: 10 },
  applicant3State: { x: 300, y: 620, width: 150, height: 15, fontSize: 10 },
  applicant3Pincode: { x: 100, y: 590, width: 100, height: 15, fontSize: 10 },
  applicant3Phone: { x: 250, y: 590, width: 150, height: 15, fontSize: 10 },
  applicant3Email: { x: 100, y: 560, width: 250, height: 15, fontSize: 10 },
  applicant3Pan: { x: 100, y: 530, width: 150, height: 15, fontSize: 10 },
  applicant3Aadhaar: { x: 100, y: 500, width: 200, height: 15, fontSize: 10 },
  // Add more fields as needed
};

// Page 8 coordinates - Additional Details and BHK Selection
export const page8Fields: PageFields = {
  bhkType: { x: 100, y: 700, width: 200, height: 15, fontSize: 10 },
  unitNumber: { x: 100, y: 680, width: 150, height: 15, fontSize: 10 },
  // Add more fields as needed
};

// All coordinates mapped by page number
export const formCoordinates: FormCoordinates = {
  5: page5Fields,
  6: page6Fields,
  7: page7Fields,
  8: page8Fields,
};

// Signature field coordinates (appears on multiple pages)
export const signatureCoordinates: { [pageNumber: number]: FieldCoordinate } = {
  5: { x: 400, y: 100, width: 150, height: 50, fontSize: 10 },
  6: { x: 400, y: 100, width: 150, height: 50, fontSize: 10 },
  7: { x: 400, y: 100, width: 150, height: 50, fontSize: 10 },
  8: { x: 400, y: 100, width: 150, height: 50, fontSize: 10 },
  // Add signature coordinates for other pages if needed
};

// Image insertion coordinates for page 21 (SCHEDULE - B)
export const page21ImageCoordinates: FieldCoordinate = {
  x: 72, // 1 inch margin
  y: 400, // Adjust based on actual position
  width: 450, // Adjust based on image size
  height: 300, // Adjust based on image size
};
