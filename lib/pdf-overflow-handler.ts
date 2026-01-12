/**
 * PDF Overflow Handler
 * 
 * Handles dynamic box creation when user input exceeds predefined boxes
 * Ensures pixel-perfect alignment and print safety
 */

import { PDFPage, PDFFont, rgb } from 'pdf-lib';
import { PDFFieldConfig, OverflowRule } from './pdf-field-config';

export interface BoxPosition {
  x: number; // X position in PDF coordinates (bottom-left origin)
  y: number; // Y position in PDF coordinates (bottom-left origin)
  boxIndex: number; // Index of box in current row
  rowIndex: number; // Index of row (0-based)
}

export interface OverflowResult {
  boxes: BoxPosition[];
  shouldWrap: boolean;
  totalRows: number;
}

/**
 * Calculate box positions including overflow handling
 */
export function calculateBoxPositions(
  inputLength: number,
  config: PDFFieldConfig,
  pageHeight: number
): OverflowResult {
  const boxes: BoxPosition[] = [];
  let currentRow = 0;
  let currentBoxInRow = 0;
  const maxRows = config.maxRows || 1;
  const lineGap = config.lineGap || 0;
  const lineHeight = config.boxHeight + lineGap;
  
  // Convert Y from top-based to bottom-based (PDF coordinate system)
  // config.y is measured from top, PDF uses bottom-left origin
  // So: pdfY = pageHeight - config.y - boxHeight (to get bottom of first box)
  const pdfY = pageHeight - config.y - config.boxHeight;
  
  for (let i = 0; i < inputLength; i++) {
    let shouldWrap = false;
    
    // Check if we need to wrap based on overflow rule
    if (config.overflowRule === 'wrap-to-next-line') {
      if (currentBoxInRow >= config.maxBoxes) {
        currentRow++;
        currentBoxInRow = 0;
        shouldWrap = true;
      }
    } else if (config.overflowRule === 'extend-horizontal') {
      // Continue in same row, extend horizontally
      shouldWrap = false;
    } else if (config.overflowRule === 'truncate') {
      // Stop at maxBoxes
      if (i >= config.maxBoxes) {
        break;
      }
    }
    
    // Check if we've exceeded max rows
    if (currentRow >= maxRows && config.overflowRule === 'wrap-to-next-line') {
      break; // Stop if we've exceeded max rows
    }
    
    // Calculate position
    const x = config.x + (currentBoxInRow * config.boxWidth);
    // Y position: for each row, move down (add) by lineHeight in PDF coordinates
    // pdfY is already converted from top to bottom, so adding lineHeight moves down
    const y = pdfY + (currentRow * lineHeight);
    
    boxes.push({
      x,
      y, // Y is already at bottom of box in PDF coordinates
      boxIndex: currentBoxInRow,
      rowIndex: currentRow,
    });
    
    currentBoxInRow++;
  }
  
  return {
    boxes,
    shouldWrap: config.overflowRule === 'wrap-to-next-line' && currentRow > 0,
    totalRows: currentRow + 1,
  };
}

/**
 * Fill field with overflow handling - dynamically creates boxes
 */
export async function fillFieldWithOverflow(
  page: PDFPage,
  value: string,
  config: PDFFieldConfig,
  font: PDFFont,
  pageHeight: number
): Promise<void> {
  if (!value) return;
  
  const inputLength = value.length;
  const characters = value.split('');
  
  // Calculate box positions with overflow handling
  const result = calculateBoxPositions(inputLength, config, pageHeight);
  
  // Font size adjustment to fit in box
  const actualFontSize = Math.min(config.fontSize, config.boxHeight * 0.7);
  const boxPaddingX = 2; // Small padding from left edge
  const verticalOffset = (config.boxHeight / 2) - (actualFontSize * 0.3);
  
  // Render each character in its calculated box position
  result.boxes.forEach((boxPos, charIndex) => {
    if (charIndex >= characters.length) return;
    
    const char = characters[charIndex];
    
    // Skip multiple spaces (optional - remove if you want to preserve all spaces)
    if (char === ' ' && charIndex > 0 && characters[charIndex - 1] === ' ') {
      return;
    }
    
    // Calculate character position within box
    // boxPos.y is the bottom of the box in PDF coordinates
    const charX = boxPos.x + boxPaddingX;
    const charY = boxPos.y + verticalOffset; // Add vertical offset from bottom
    
    // Ensure we don't render outside page boundaries (A4: 612 × 792 points)
    const A4_WIDTH = 612;
    const A4_HEIGHT = 792;
    if (charX < 0 || charX > A4_WIDTH || charY < 0 || charY > A4_HEIGHT) {
      console.warn(`Character "${char}" at position (${charX}, ${charY}) is outside A4 boundaries`);
      return;
    }
    
    // Draw character
    page.drawText(char, {
      x: charX,
      y: charY,
      size: actualFontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * Format value based on field type before rendering
 */
export function formatFieldValue(fieldName: string, value: string): string {
  // Format dates
  if (fieldName.includes('dob') || fieldName.includes('Date')) {
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }
    return value;
  }
  
  // Format Aadhaar (12 digits: XXXX XXXX XXXX)
  if (fieldName.includes('aadhaar') || fieldName.includes('Aadhaar')) {
    const digits = value.replace(/\s/g, '').slice(0, 12);
    if (digits.length === 12) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
    }
    return value;
  }
  
  // Format phone numbers (remove formatting)
  if (fieldName.includes('phone') || fieldName.includes('Phone') || fieldName.includes('Mobile')) {
    return value.replace(/\D/g, '').slice(0, 10);
  }
  
  // Format PAN (uppercase, alphanumeric only)
  if (fieldName.includes('pan') || fieldName.includes('Pan')) {
    return value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 10);
  }
  
  // Remove currency symbols from price fields
  if (fieldName.includes('Price') || fieldName.includes('price')) {
    return value.replace(/[₹,\s]/g, '').trim();
  }
  
  return value;
}
