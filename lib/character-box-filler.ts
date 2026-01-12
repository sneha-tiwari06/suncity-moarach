/**
 * Character Box Filler Utility
 * 
 * Converts form data values into character arrays and fills PDF
 * fields character-by-character, with each character in its own box
 */

import { PDFPage, PDFFont, rgb } from 'pdf-lib';

export interface CharacterBoxConfig {
  boxWidth: number;  // Width of each character box
  boxHeight: number; // Height of each character box
  boxSpacing: number; // Space between boxes (usually 0 for adjacent boxes)
  startX: number;    // Starting X position of first box
  startY: number;    // Y position (adjusted for PDF coordinates)
  maxCharacters: number; // Maximum number of character boxes
}

/**
 * Convert a string value into an array of characters
 * Truncate if longer than maxLength
 * Preserves all characters including spaces
 */
export function stringToCharacterArray(value: string, maxLength: number): string[] {
  if (!value) return [];
  const str = String(value).slice(0, maxLength);
  // Split into array of individual characters (including spaces)
  return str.split('');
}

/**
 * Fill a field with character-by-character positioning
 * Each character is drawn in its own box
 * Characters are positioned at the baseline of each box
 */
export async function fillCharacterBoxes(
  page: PDFPage,
  value: string,
  config: CharacterBoxConfig,
  font: PDFFont,
  fontSize: number = 10
): Promise<void> {
  if (!value) return;

  // Convert value to character array (preserve all characters including spaces)
  const strValue = String(value);
  const characters = stringToCharacterArray(strValue, config.maxCharacters);
  
  // Padding from left edge of box (small offset for readability)
  const boxPaddingX = 2;
  // Vertical positioning: align to baseline within the box
  // The box height centers the text, but we need to account for font metrics
  // For Helvetica 10pt: ascender ~7.4pt, so we offset to center vertically
  const verticalOffset = (config.boxHeight / 2) - (fontSize * 0.3); // Adjust for font baseline

  characters.forEach((char, index) => {
    // Skip spaces if they're not meaningful (or keep them if needed)
    if (char === ' ' && index > 0 && characters[index - 1] === ' ') {
      return; // Skip multiple spaces
    }
    
    // Calculate X position: startX + (index * boxWidth) + padding
    // Each box is adjacent, so we multiply index by boxWidth
    const boxStartX = config.startX + (index * config.boxWidth);
    const charX = boxStartX + boxPaddingX;
    
    // Y position: startY is the bottom of the field, add offset for baseline
    // config.startY is already adjusted for PDF coordinate system (bottom-left origin)
    const charY = config.startY + verticalOffset;

    // Draw each character in its own box
    // Using small font size to fit within box
    page.drawText(char, {
      x: charX,
      y: charY,
      size: Math.min(fontSize, config.boxHeight * 0.7), // Ensure font fits in box
      font: font,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * Calculate character box configuration from field coordinates
 */
export function calculateBoxConfig(
  fieldCoord: { x: number; y: number; width: number; height: number; maxChars?: number },
  pageHeight: number,
  maxCharacters: number = 25
): CharacterBoxConfig {
  const actualMaxChars = fieldCoord.maxChars || maxCharacters;
  const boxWidth = fieldCoord.width / actualMaxChars;
  const boxHeight = fieldCoord.height;
  const boxSpacing = 0; // Adjacent boxes (no spacing)
  
  // Adjust Y coordinate (PDF uses bottom-left origin)
  const adjustedY = pageHeight - fieldCoord.y - fieldCoord.height;

  return {
    boxWidth,
    boxHeight,
    boxSpacing,
    startX: fieldCoord.x,
    startY: adjustedY,
    maxCharacters: actualMaxChars,
  };
}
