/**
 * PDF Field Configuration System
 * 
 * Defines field mappings with overflow handling rules
 * Maintains pixel-perfect, print-safe PDF generation
 */

export type OverflowRule = 'extend-horizontal' | 'wrap-to-next-line' | 'truncate';

export interface PDFFieldConfig {
  field: string; // Field identifier (maps to FormData key)
  page: number; // PDF page number (1-indexed)
  x: number; // X position (from left, in points)
  y: number; // Y position (from top of page, will be converted to bottom-left)
  boxWidth: number; // Width of each character box (points)
  boxHeight: number; // Height of each character box (points)
  maxBoxes: number; // Maximum number of boxes in first row
  maxRows?: number; // Maximum number of rows (for multi-line fields)
  overflowRule: OverflowRule; // How to handle overflow
  fontSize: number; // Font size in points
  fontName?: string; // Font name if custom
  lineGap?: number; // Gap between lines for multi-line (default: 0)
}

/**
 * Field configuration for all fillable fields
 * Coordinates must be measured from actual PDF (top-left origin for Y)
 */
export const pdfFieldConfigs: PDFFieldConfig[] = [
  // Page 5 - Applicant 1
  {
    field: 'title',
    page: 5,
    x: 100,
    y: 700,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 5,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'name',
    page: 5,
    x: 150,
    y: 700,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    maxRows: 2,
    overflowRule: 'wrap-to-next-line',
    fontSize: 10,
  },
  {
    field: 'sonWifeDaughterOf',
    page: 5,
    x: 100,
    y: 680,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    maxRows: 2,
    overflowRule: 'wrap-to-next-line',
    fontSize: 10,
  },
  {
    field: 'nationality',
    page: 5,
    x: 100,
    y: 660,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    overflowRule: 'extend-horizontal',
    fontSize: 10,
  },
  {
    field: 'age',
    page: 5,
    x: 100,
    y: 640,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 3,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'dob',
    page: 5,
    x: 140,
    y: 640,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 10,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'profession',
    page: 5,
    x: 100,
    y: 620,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    maxRows: 2,
    overflowRule: 'wrap-to-next-line',
    fontSize: 10,
  },
  {
    field: 'aadhaar',
    page: 5,
    x: 100,
    y: 600,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 14, // 12 digits + 2 spaces
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'pan',
    page: 5,
    x: 100,
    y: 580,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 10,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'itWard',
    page: 5,
    x: 100,
    y: 560,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 30,
    maxRows: 2,
    overflowRule: 'wrap-to-next-line',
    fontSize: 10,
  },
  {
    field: 'correspondenceAddress',
    page: 5,
    x: 100,
    y: 540,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    maxRows: 3,
    overflowRule: 'wrap-to-next-line',
    lineGap: 2,
    fontSize: 10,
  },
  {
    field: 'telNo',
    page: 5,
    x: 100,
    y: 480,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 15,
    overflowRule: 'extend-horizontal',
    fontSize: 10,
  },
  {
    field: 'phone',
    page: 5,
    x: 250,
    y: 480,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 10,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'email',
    page: 5,
    x: 100,
    y: 460,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 30,
    maxRows: 2,
    overflowRule: 'wrap-to-next-line',
    fontSize: 10,
  },
  
  // Page 6 - Applicant 2 (same structure, different Y positions)
  {
    field: 'title',
    page: 6,
    x: 100,
    y: 700,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 5,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'name',
    page: 6,
    x: 150,
    y: 700,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    maxRows: 2,
    overflowRule: 'wrap-to-next-line',
    fontSize: 10,
  },
  // ... (similar pattern for applicant 2)
  
  // Page 7 - Applicant 3 (same structure)
  // ... (similar pattern for applicant 3)
  
  // Page 8 - Apartment Details
  {
    field: 'tower',
    page: 8,
    x: 100,
    y: 700,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 15,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'apartmentNumber',
    page: 8,
    x: 250,
    y: 700,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 15,
    overflowRule: 'extend-horizontal',
    fontSize: 10,
  },
  {
    field: 'bhkType',
    page: 8,
    x: 100,
    y: 680,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 10,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'floor',
    page: 8,
    x: 200,
    y: 680,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 15,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'carpetAreaSqm',
    page: 8,
    x: 100,
    y: 660,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 10,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'unitPrice',
    page: 8,
    x: 250,
    y: 660,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 15,
    overflowRule: 'extend-horizontal',
    fontSize: 10,
  },
  {
    field: 'totalPrice',
    page: 8,
    x: 100,
    y: 640,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 15,
    overflowRule: 'extend-horizontal',
    fontSize: 10,
  },
  {
    field: 'declarationDate',
    page: 8,
    x: 100,
    y: 150,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 10,
    overflowRule: 'truncate',
    fontSize: 10,
  },
  {
    field: 'declarationPlace',
    page: 8,
    x: 200,
    y: 150,
    boxWidth: 8,
    boxHeight: 15,
    maxBoxes: 25,
    overflowRule: 'extend-horizontal',
    fontSize: 10,
  },
];

/**
 * Get field configurations for a specific page and applicant
 */
export function getFieldConfigsForPage(
  page: number,
  applicantIndex: number = 0
): PDFFieldConfig[] {
  return pdfFieldConfigs.filter(config => {
    if (config.page !== page) return false;
    
    // For pages 5, 6, 7, filter by applicant index
    if (page >= 5 && page <= 7) {
      // This is a simplified filter - you may need to adjust field naming
      // based on your actual field structure
      return true; // For now, return all - filtering by field name will happen later
    }
    
    return true;
  });
}
