import { FormData, ApplicantData } from './types';
import fs from 'fs';
import path from 'path';
import { hasApplicant3Data } from './applicant-utils';
/**
 * Server-side HTML rendering utilities for pages 5-8
 * These generate HTML strings that match the preview page design
 */

const CONTAINER_WIDTH = 210; // A4 width in mm
const CONTAINER_HEIGHT = 297; // A4 height in mm
// Applicant form constants (pages 5-7)
const APPLICANT_PADDING = 15;
const APPLICANT_PHOTO_WIDTH = 162;
const APPLICANT_GAP = 10;
const APPLICANT_LABEL_WIDTH = 100;
const APPLICANT_FIELD_GAP = 10;
const APPLICANT_BOX_WIDTH = 20;
const APPLICANT_BOX_HEIGHT = 20;
const APPLICANT_BORDER_WIDTH = 1;
// Apartment form constants (page 8)
const APARTMENT_PADDING = 20;
const APARTMENT_LABEL_WIDTH = 120;
const APARTMENT_FIELD_GAP = 10;
const APARTMENT_RATE_BOX_WIDTH = 180;
const APARTMENT_GAP = 16;

/**
 * Render character boxes HTML - matches preview page exactly
 * Dynamically creates boxes based on data length and calculates boxes per line
 * Ensures all data is displayed and boxes only wrap when a line is full
 * 
 * @param value - The text value to render
 * @param initialBoxCount - Maximum boxes per line (for fields like name: 20, ward: 23, address: 28)
 * @param boxWidth - Width of each character box in pixels
 */
function renderCharacterBoxesHTML(value: string, initialBoxCount: number = 28, boxWidth: number = APPLICANT_BOX_WIDTH): string {
  const boxHeight = APPLICANT_BOX_HEIGHT; // 20px
  const borderWidth = APPLICANT_BORDER_WIDTH; // 1px
  
  // Get all characters from value (don't truncate - show all data)
  const chars = value ? value.toString().split('') : [];
  
  // Calculate available width for boxes
  // Container width: 210mm (A4) = ~794px
  // Minus padding: 40px (20px each side)
  // Minus label width: ~100-200px (varies by field)
  // Minus field gap: 10px
  // Approximate available width: 794 - 40 - 150 - 10 = ~594px
  const containerWidthPx = 794; // A4 width in pixels (210mm * 3.779527559)
  const padding = 40; // Total horizontal padding
  const avgLabelWidth = 150; // Average label width
  const fieldGap = 10;
  const availableWidth = containerWidthPx - padding - avgLabelWidth - fieldGap; // ~594px
  
  // Calculate how many boxes fit per line based on available width
  const maxBoxesPerLineByWidth = Math.floor(availableWidth / boxWidth);
  
  // Use initialBoxCount as the maximum boxes per line
  // This ensures fields with specific character limits break at that limit
  // For example: name fields (20), ward fields (23), address fields (28)
  // If initialBoxCount is very large (like 46 or 84 for multi-line fields),
  // we need to determine the per-line limit differently
  // Common limits: 20, 23, 25, 28 - if initialBoxCount is significantly larger,
  // it might indicate total boxes, so we estimate per-line limit
  let boxesPerLine: number;
  if (initialBoxCount <= 30) {
    // For single-line or small multi-line fields, use initialBoxCount directly
    boxesPerLine = initialBoxCount;
  } else if (initialBoxCount <= 50) {
    // Likely 2 lines (e.g., 46 = 2 × 23), use half
    boxesPerLine = Math.ceil(initialBoxCount / 2);
  } else {
    // Likely 3 lines (e.g., 84 = 3 × 28), use third
    boxesPerLine = Math.ceil(initialBoxCount / 3);
  }
  
  // Don't exceed the width-based limit
  boxesPerLine = Math.min(boxesPerLine, maxBoxesPerLineByWidth);
  
  // Determine total boxes needed:
  // - If data is shorter or equal to initialBoxCount: use initialBoxCount (for initial layout)
  // - If data is longer: create enough boxes to show all data (dynamic expansion)
  const totalBoxes = chars.length > initialBoxCount ? chars.length : initialBoxCount;
  
  // Group boxes into rows to control line breaks precisely
  // Always fill a line completely before moving to the next line
  const rows: string[][] = [];
  let remainingBoxes = totalBoxes;
  let charIndex = 0;
  
  while (remainingBoxes > 0) {
    const boxesInThisRow = Math.min(boxesPerLine, remainingBoxes);
    const rowChars: string[] = [];
    
    // Fill this row with characters (if available) or empty boxes
    for (let i = 0; i < boxesInThisRow; i++) {
      if (charIndex < chars.length) {
        rowChars.push(chars[charIndex]);
        charIndex++;
      } else {
        // No more characters, add empty box
        rowChars.push('');
      }
    }
    
    rows.push(rowChars);
    remainingBoxes -= boxesInThisRow;
  }
  
  // Render each row
  const rowsHTML = rows.map((rowChars) => {
    const boxes = rowChars.map((char) => {
      return `
        <div style="
          width: ${boxWidth}px;
          height: ${boxHeight}px;
          min-width: ${boxWidth}px;
          max-width: ${boxWidth}px;
          min-height: ${boxHeight}px;
          font-size: 10px;
          font-weight: 600;
          line-height: ${boxHeight}px;
          border: ${borderWidth}px solid #ee1e23;
          background-color: white;
          color: #58595b;
          text-align: center;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          flex-shrink: 0;
          flex-grow: 0;
        ">${char}</div>
      `;
    }).join('');
    
    return `
      <div style="
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 1px;
        flex-direction: row;
        width: 100%;
      ">${boxes}</div>
    `;
  }).join('');

  return `
    <div style="
      overflow: visible;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
      width: 100%;
    ">${rowsHTML}</div>
  `;
}

/**
 * Render signature footer HTML - shows all available signatures dynamically
 * Can be used as overlay for static pages or as footer in dynamic pages
 */
export function renderSignatureFooterHTML(formData: FormData): string {
  const hasFirstSignature = formData.applicants[0]?.signature;
  const hasSecondSignature = formData.applicants[1]?.signature;
  const hasThirdSignature = formData.applicants[2]?.signature;

  // Show all available signatures on all pages
  if (!hasFirstSignature && !hasSecondSignature && !hasThirdSignature) return '';

  let html = '<div class="signature-footer">';

  if (hasFirstSignature) {
    html += `
      <div style="display: flex; gap: 10px;">
        <div style="display: flex; align-items: flex-end; padding-bottom: 15px">
          <label style="font-weight: bold; color: #58595b; font-size: 11px;">Signature:</label>
        </div>
        <div>
          <div style="margin-bottom: 4px; text-align: center;">
            <span style="color: #58595b; font-style: italic; font-size: 11px;">Sole/First Applicant</span>
          </div>
          <div style="border: 1px dashed #ee1e23; background-color: white; border-radius: 12px; overflow: hidden; width: 150px; height: 45px; display: flex; align-items: center; justify-content: center;">
            <img src="${formData.applicants[0].signature}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        </div>
      </div>
    `;
  }

  if (hasSecondSignature) {
    html += `
      <div style="display: flex; gap: 10px;">
        <div style="display: flex; align-items: flex-end; padding-bottom: 15px">
          <label style="font-weight: bold; color: #58595b; font-size: 11px;">Signature:</label>
        </div>
        <div>
          <div style="margin-bottom: 4px; text-align: center;">
            <span style="color: #58595b; font-style: italic; font-size: 11px;">Second Applicant</span>
          </div>
          <div style="border: 1px dashed #ee1e23; background-color: white; border-radius: 12px; overflow: hidden; width: 150px; height: 45px; display: flex; align-items: center; justify-content: center;">
            <img src="${formData.applicants[1].signature}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        </div>
      </div>
    `;
  }

  if (hasThirdSignature) {
    html += `
      <div style="display: flex; gap: 10px;">
        <div style="display: flex; align-items: flex-end; padding-bottom: 15px">
          <label style="font-weight: bold; color: #58595b; font-size: 11px;">Signature:</label>
        </div>
        <div>
          <div style="margin-bottom: 4px; text-align: center;">
            <span style="color: #58595b; font-style: italic; font-size: 11px;">Third Applicant</span>
          </div>
          <div style="border: 1px dashed #ee1e23; background-color: white; border-radius: 12px; overflow: hidden; width: 150px; height: 45px; display: flex; align-items: center; justify-content: center;">
            <img src="${formData.applicants[2].signature}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        </div>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Render signature footer HTML as standalone overlay page for static PDF pages
 * This creates a full A4 page with footer overlay that can be merged with static pages
 */
export function renderSignatureFooterOverlayHTML(formData: FormData): string {
  const signatureFooter = renderSignatureFooterHTML(formData);
  
  if (!signatureFooter) return '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=612, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 210mm;
          max-width: 210mm;
          min-width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background: transparent;
          overflow: hidden;
        }
        .signature-footer-wrapper {
          position: absolute;
          bottom: 24px;
          left: 24px;
          right: 24px;
          background-color: white;
          padding: 20px;
        }
        .signature-footer {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-top: 50px;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>
      <div class="signature-footer-wrapper">
        ${signatureFooter}
      </div>
    </body>
    </html>
  `;
}

/**
 * Convert SVG file to base64 data URI
 */
function getSVGAsDataURI(svgPath: string): string {
  try {
    const fullPath = path.join(process.cwd(), 'public', svgPath);
    if (fs.existsSync(fullPath)) {
      const svgContent = fs.readFileSync(fullPath, 'utf8');
      const base64 = Buffer.from(svgContent).toString('base64');
      return `data:image/svg+xml;base64,${base64}`;
    }
  } catch (error) {
    console.error(`Error loading SVG ${svgPath}:`, error);
  }
  return '';
}
/**
 * Format date to DD-MM-YYYY format (with hyphens)
 */
function formatDOBToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Handle YYYY-MM-DD format (from date input)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    
    // Handle other date formats
    const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateMatch) {
      const [, part1, part2, part3] = dateMatch;
      let day = part1;
      let month = part2;
      let year = part3;
      
      // Determine format
      if (part1.length === 4 || parseInt(part1) > 12) {
        // YYYY-MM-DD format
        year = part1;
        month = part2;
        day = part3;
      } else if (parseInt(part1) > 12) {
        // DD/MM/YYYY format
        day = part1;
        month = part2;
        year = part3.length === 2 ? '20' + part3 : part3;
      } else {
        // MM/DD/YYYY format
        month = part1;
        day = part2;
        year = part3.length === 2 ? '20' + part3 : part3;
      }
      
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    
    // If already in ddmmyyyy format (8 digits), parse and add hyphens
    const digitsOnly = dateStr.replace(/[\/\-\s]/g, '');
    if (/^\d{8}$/.test(digitsOnly)) {
      const day = digitsOnly.substring(0, 2);
      const month = digitsOnly.substring(2, 4);
      const year = digitsOnly.substring(4, 8);
      return `${day}-${month}-${year}`;
    }
    
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Render applicant form HTML (Page 5, 6, 7)
 */
export function renderApplicantFormHTML(applicant: ApplicantData, applicantNumber: number, formData: FormData): string {
  if (!applicant) return '';
  
  // For applicant 1, only show if name exists (now optional when skipping to third applicant)
  if (applicantNumber === 1) {
    if (!applicant.name || applicant.name.trim() === '') return '';
  }
  // For applicant 2, only show if name exists
  else if (applicantNumber === 2) {
    if (!applicant.name || applicant.name.trim() === '') return '';
  }
  // For applicant 3, show if any data exists (name or company fields)
  else if (applicantNumber === 3) {
    if (!hasApplicant3Data(applicant)) return '';
  }

  const titleName = `${applicant.name || ''}`.trim() || '';
  const residentialStatus = applicant.residentialStatus || '';
  
  // Don't pre-split multi-line fields - let renderCharacterBoxesHTML handle it
  // This ensures boxes fill completely before wrapping
  const itWard = applicant.itWard || '';
  const correspondenceAddress = applicant.correspondenceAddress || '';
  
  // Format DOB to DDMMYYYY
  const formattedDOB = formatDOBToDDMMYYYY(applicant.dob || '');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=612, initial-scale=1.0">
      <style>
        @page:first {
          margin-top: 0;
        }
        @page {
          margin-top: 30px;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          background: white;
          color: #58595b;
        }
        main{
          padding: 24px;
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
        }
        .container {
          width: 100%;
          padding: 20px;
          border: 1px solid #58595b;
          box-sizing: border-box;
          min-height: calc(${CONTAINER_HEIGHT}mm - 48px);
          display: grid;
          grid-template-rows: 65px 1fr auto;
          position: relative;
        }
        .header {
          margin-bottom: 12px;
        }
        .field-row {
          display: flex;
          align-items: center;
          gap: ${APPLICANT_FIELD_GAP}px;
          align-self: self-start;
        }
        .label {
          font-weight: bold;
          color: #58595b;
          font-size: 12px;
          width: ${APPLICANT_LABEL_WIDTH}px;
          flex-shrink: 0;
          min-width: ${APPLICANT_LABEL_WIDTH}px;
        }

        // .fields-area h2 + div + div .label{
        //   width: calc(${APPLICANT_LABEL_WIDTH}px * 2);
        //   min-width: calc(${APPLICANT_LABEL_WIDTH}px * 2);

        // }

        .fields-area {
          display: flex;
          flex-wrap: wrap;
          flex-direction: column;
          gap: 12px;
        }
        .fields-left-container {
          display: flex;
          gap: 12px;
        }
        .fields-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .photo-section {
          width: ${APPLICANT_PHOTO_WIDTH}px;
          flex-shrink: 0;
        }
        .photo-box {
          border: 1px solid #ee1e23;
          background: white;
          padding: 8px;
          width: 100%;
        }
        .photo-container {
          aspect-ratio: 4/5;
          background: white;
          border: 1px solid #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          width: 100%;
        }
        .photo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .fields-right {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .checkbox-group {
          display: flex;
          flex-direction: row;
          gap: 40px;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .checkbox {
          width: 12px;
          height: 12px;
          border: 1px solid #ff7f82;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkbox-text {
          font-weight: bold;
          color: #58595b;
          font-size: 9px;
        }
        .multi-line-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .signature-footer {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          justify-content: space-between;
          margin-top: 50px;
        }
      </style>
    </head>
    <body>
      <main>
        <div class="container">
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;">
              <div>
                ${getSVGAsDataURI('/images/logo-suncity-color.svg') ? `<img src="${getSVGAsDataURI('/images/logo-suncity-color.svg')}" alt="Suncity Projects Logo" style="width: auto; height: 40px;" />` : ''}
              </div>
              <div>
                ${getSVGAsDataURI('/images/logo-monarch-color.svg') ? `<img src="${getSVGAsDataURI('/images/logo-monarch-color.svg')}" alt="Suncity's Monarch Residences Logo" style="width: auto; height: 48px;" />` : ''}
              </div>
            </div>
          </div>

          <div class="fields-area">
            <h2 style=" text-transform: uppercase; font-size: 12px; margin: 0;">
                ${applicantNumber}. ${applicantNumber === 1 ? 'SOLE OR FIRST APPLICANT(S):-' : applicantNumber === 2 ? 'JOINT/SECOND APPLICANT(S):-' : 'THIRD APPLICANT(S):-'}
              </h2>
            <div style="display: flex; gap: 12px;">
              <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                <div class="field-row">
                  <div class="label">${applicant.title || ''}</div>
                  ${renderCharacterBoxesHTML(titleName, 20, APPLICANT_BOX_WIDTH)}
                </div>
                <div class="field-row">
                  <div class="label">${applicant.relation || ''}</div>
                  ${renderCharacterBoxesHTML(applicant.sonWifeDaughterOf || '', 20, APPLICANT_BOX_WIDTH)}
                </div>
                <div class="field-row">
                  <div class="label">Nationality:</div>
                  ${renderCharacterBoxesHTML(applicant.nationality || '', 20, APPLICANT_BOX_WIDTH)}
                </div>
                <div style="display: flex; gap: 20px;">
                  <div class="field-row">
                    <div class="label">Age (in years):</div>
                    ${renderCharacterBoxesHTML(applicant.age || '', 5, APPLICANT_BOX_WIDTH)}
                  </div>
                  <div class="field-row">
                    <div class="label" style="width:auto; min-width:50px;">DOB:</div>
                    ${renderCharacterBoxesHTML(formattedDOB, 10, APPLICANT_BOX_WIDTH)}
                  </div>
                </div>
                <div class="field-row">
                  <div class="label">Profession:</div>
                  ${renderCharacterBoxesHTML(applicant.profession || '', 20, APPLICANT_BOX_WIDTH)}
                </div>
                <div class="field-row">
                  <div class="label">Aadhar No.:</div>
                  ${renderCharacterBoxesHTML(applicant.aadhaar || '', 20, APPLICANT_BOX_WIDTH)}
                </div>
              </div>

              <div class="photo-section">
                <div class="photo-box">
                  <div class="photo-container">
                    ${applicant.photograph ? `<img src="${applicant.photograph}" alt="Applicant Photo" />` : '<span style="color: #9ca3af; font-size: 8px; text-align: center; padding: 4px;">Photo</span>'}
                  </div>
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div class="field-row" style="align-items: flex-start; margin-top: 2px;">
                <div class="label" style="padding-top: 4px;">Residential Status:</div>
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <div class="checkbox" style="background: ${residentialStatus === 'Resident' ? '#ff7f82' : 'white'}; border: 1px solid ${residentialStatus === 'Resident' ? '#ff7f82' : '#ff7f82'};">
                      ${residentialStatus === 'Resident' ? '<span style="color: white; font-weight: bold; font-size: 9px;">✓</span>' : ''}
                    </div>
                    <span class="checkbox-text">Resident</span>
                  </div>
                  <div class="checkbox-item">
                    <div class="checkbox" style="background: ${residentialStatus === 'Non-Resident' ? '#ff7f82' : 'white'}; border: 1px solid ${residentialStatus === 'Non-Resident' ? '#ff7f82' : '#ff7f82'};">
                      ${residentialStatus === 'Non-Resident' ? '<span style="color: white; font-weight: bold; font-size: 9px;">✓</span>' : ''}
                    </div>
                    <span class="checkbox-text">Non- Resident</span>
                  </div>
                  <div class="checkbox-item">
                    <div class="checkbox" style="background: ${residentialStatus === 'Foreign National of Indian Origin' ? '#ff7f82' : 'white'}; border: 1px solid ${residentialStatus === 'Foreign National of Indian Origin' ? '#ff7f82' : '#ff7f82'};">
                      ${residentialStatus === 'Foreign National of Indian Origin' ? '<span style="color: white; font-weight: bold; font-size: 9px;">✓</span>' : ''}
                    </div>
                    <span class="checkbox-text">Foreign National of Indian Origin</span>
                  </div>
                </div>
              </div>
              <div class="field-row">
                <div class="label" style=" width: calc(${APPLICANT_LABEL_WIDTH}px * 2); min-width: calc(${APPLICANT_LABEL_WIDTH}px * 2);">Income Tax Permanent Account No.:</div>
                ${renderCharacterBoxesHTML(applicant.pan || '', 23, APPLICANT_BOX_WIDTH)}
              </div>
              <div class="field-row" style="align-items: flex-start;">
                <div class="label" style="padding-top: 4px; line-height: 1.25; width: calc(${APPLICANT_LABEL_WIDTH}px * 2); min-width: calc(${APPLICANT_LABEL_WIDTH}px * 2);">Ward / Circle / Special Range / Place, where assessed to income tax:</div>
                <div class="multi-line-field">
                  ${renderCharacterBoxesHTML(itWard, 46, APPLICANT_BOX_WIDTH)}
                </div>
              </div>
              <div class="field-row" style="align-items: flex-start;">
                <div class="label" style="padding-top: 4px;">Correspondence Address:</div>
                <div class="multi-line-field">
                  ${renderCharacterBoxesHTML(correspondenceAddress, 84, APPLICANT_BOX_WIDTH)}
                </div>
              </div>
              <div style="display: flex; gap: 24px;">
                <div class="field-row">
                  <div class="label">Tel No.:</div>
                  ${renderCharacterBoxesHTML(applicant.telNo || '', 12, APPLICANT_BOX_WIDTH)}
                </div>
                <div class="field-row">
                  <div class="label" style="width:auto; min-width:50px;">Mobile:</div>
                  ${renderCharacterBoxesHTML(applicant.phone || '', 12, APPLICANT_BOX_WIDTH)}
                </div>
              </div>
              <div class="field-row">
                <div class="label">E-Mail ID:</div>
                ${renderCharacterBoxesHTML(applicant.email || '', 28, APPLICANT_BOX_WIDTH)}
              </div>
            </div>

            ${applicantNumber === 3 ? `
              <div class="">
                <h2 style="text-transform: uppercase; font-size: 12px; text-align: center; margin-bottom:10px;">OR</h2>
                <p style="font-size: 11px; font-style: italic; color: #58595b; margin-bottom:5px">
                  [If the allottee is company, firm, HUF, association / society]
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <div class="field-row">
                    <div class="label">M/s.:</div>
                    ${renderCharacterBoxesHTML(applicant.companyName || '', 28, APPLICANT_BOX_WIDTH)}
                  </div>
                  
                  <div class="field-row" style="align-items: flex-start;">
                    <div class="label" style="padding-top: 4px; width: 165px">Reg. Office/Corporate Office:</div>
                    <div class="multi-line-field">
                      ${Array.from({ length: 2 }, (_, i) => {
                        const lineValue = i === 0 ? (applicant.regOfficeLine1 || '') : (applicant.regOfficeLine2 || '');
                        // Only create boxes if there's content, otherwise show empty
                        if (!lineValue || lineValue.trim() === '') {
                          return '<div></div>';
                        }
                        return `<div>${renderCharacterBoxesHTML(lineValue, 25, APPLICANT_BOX_WIDTH)}</div>`;
                      }).join('')}
                    </div>
                  </div>
                  
                  <div class="field-row" style="align-items: flex-start;">
                    <div class="label" style="padding-top: 4px;">Authorized Signatory:</div>
                    <div class="multi-line-field">
                      ${Array.from({ length: 2 }, (_, i) => {
                        const lineValue = i === 0 ? (applicant.authorizedSignatoryLine1 || '') : (applicant.authorizedSignatoryLine2 || '');
                        // Only create boxes if there's content, otherwise show empty
                        if (!lineValue || lineValue.trim() === '') {
                          return '<div></div>';
                        }
                        return `<div>${renderCharacterBoxesHTML(lineValue, 28, APPLICANT_BOX_WIDTH)}</div>`;
                      }).join('')}
                    </div>
                  </div>
                  
                  <div class="field-row">
                    <div class="label" style="width: calc(${APPLICANT_LABEL_WIDTH}px * 2 + 15px); min-width: calc(${APPLICANT_LABEL_WIDTH}px * 2 + 15px);">Board Resolution dated/Power of Attorney:</div>
                    ${renderCharacterBoxesHTML(applicant.boardResolutionDate || '', 22, APPLICANT_BOX_WIDTH)}
                  </div>
                  
                  <div class="field-row">
                    <div class="label" style="width">PAN No./TIN No.:</div>
                    ${renderCharacterBoxesHTML(applicant.companyPanOrTin || '', 28, APPLICANT_BOX_WIDTH)}
                  </div>
                  
                  <div style="display: flex; gap: 12px;">
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                      <div class="field-row">
                        <div class="label">Tel No.:</div>
                        ${renderCharacterBoxesHTML(applicant.companyTelNo || '', 10, APPLICANT_BOX_WIDTH)}
                      </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                      <div class="field-row">
                        <div class="label">Mobile No.:</div>
                        ${renderCharacterBoxesHTML(applicant.companyMobileNo || '', 10, APPLICANT_BOX_WIDTH)}
                      </div>
                    </div>
                  </div>
                  
                  <div style="display: flex; gap: 12px;">
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                      <div class="field-row">
                        <div class="label">E-mail ID:</div>
                        ${renderCharacterBoxesHTML(applicant.companyEmail || '', 11, APPLICANT_BOX_WIDTH)}
                      </div>
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
                      <div class="field-row">
                        <div class="label">Fax No.:</div>
                        ${renderCharacterBoxesHTML(applicant.companyFaxNo || '', 11, APPLICANT_BOX_WIDTH)}
                      </div>
                    </div>
                  </div>
                  
                  <p style="font-size: 10px; color: #58595b; margin-top: 6px; font-style: italic;">
                    (attach a certified true copy of the Board Resolution/Power of Attorney)
                  </p>
                </div>
              </div>
            ` : ''}
          </div>
          ${applicantNumber === 3 ? `<div>
            ${renderSignatureFooterHTML(formData)}
            </div>` : `
            ${renderSignatureFooterHTML(formData)}
          `}
        </div>
      </main>
    </body>
    </html>
  `;

  return html;
}

/**
 * Render apartment form HTML (Page 8)
 */
export function renderApartmentFormHTML(formData: FormData): string {
  const bhkTypeDisplay = formData.bhkType === '3bhk' ? '3 BHK' : formData.bhkType === '4bhk' ? '4 BHK' : '';
  // const unitPriceClean = formData.unitPrice ? formData.unitPrice.replace(/[₹,]/g, '') : '';
  // const totalPriceClean = formData.totalPrice ? formData.totalPrice.replace(/[₹,]/g, '') : '';

  const formatDateToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return original if invalid date
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      return `${day}-${month}-${year}`;
    } catch {
      // If dateStr is in other format, try to parse it
      // Handle formats like "12/01/2025", "12-01-2025", "2025-01-12", etc.
      const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, part1, part2, part3] = dateMatch;
        let day = part1;
        let month = part2;
        let year = part3;
        
        // Determine if it's MM/DD/YYYY or DD/MM/YYYY format
        if (part1.length === 4 || parseInt(part1) > 12) {
          // YYYY-MM-DD format
          year = part1;
          month = part2;
          day = part3;
        } else if (parseInt(part1) > 12) {
          // DD/MM/YYYY format
          day = part1;
          month = part2;
          year = part3.length === 2 ? '20' + part3 : part3;
        } else {
          // MM/DD/YYYY format
          month = part1;
          day = part2;
          year = part3.length === 2 ? '20' + part3 : part3;
        }
        
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
      
      // If already in ddmmyy format (6 digits), convert to dd-mm-yyyy
      const digitsOnly = dateStr.replace(/[\/\-\s]/g, '');
      if (/^\d{6}$/.test(digitsOnly)) {
        const day = digitsOnly.substring(0, 2);
        const month = digitsOnly.substring(2, 4);
        const year = '20' + digitsOnly.substring(4, 6);
        return `${day}-${month}-${year}`;
      }
      
      return dateStr;
    }
  };

  const formattedDate = formatDateToDDMMYYYY(formData.declarationDate || '');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=612, initial-scale=1.0">
      <style>
        @page:first {
          margin-top: 0;
        }
        @page {
          margin-top: 30px;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          background: white;
          color: #58595b;
        }
        main{
          padding: 24px;
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
        }
        .container {
          width: 100%;
          padding: 20px;
          padding-top: 40px;
          border: 1px solid #58595b;
          box-sizing: border-box;
          min-height: calc(${CONTAINER_HEIGHT}mm - 48px);
          display: grid;
          grid-template-rows: 65px 1fr auto;
          position: relative;
        }
        body > main > .container:first-child {
          padding-top: 20px;
        }
        .header {
          margin-bottom: 12px;
        }
        .fields-area {
          display: flex;
          flex-wrap: wrap;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 12px;
        }
        .field-row {
          display: flex;
          align-items: center;
          gap: ${APARTMENT_FIELD_GAP}px;
          margin-bottom: 10px;
        }
        .label {
          color: #58595b;
          font-size: 12px;
          width: 85px;
          flex-shrink: 0;
          min-width: 85px;
        }
        .value-field {
          border-bottom: 1px solid #58595b;
          color: #58595b;
          flex: 1;
          min-width: 150px;
          height: 20px;
          font-size: 13px;
          padding-left: 4px;
        }
        .fields-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 40px;
          border: 1px solid #58595b;
        }
        .rate-box {
          border-left: 1px solid #58595b;
          padding: 24px;
          min-height: 200px;
          flex-grow: 1;
          flex-basis: 0;
        }
        .note-section {
          color: #58595b;
          margin-bottom: 40px;
        }
        .declaration-section {
        }
          
        .declaration-text {
          font-size: 13px;
          line-height: 1.5;
          color: #58595b;
        }
        .declaration-footer {
          margin-top: 20px;
        }
        .date-place-row {
          display: flex;
          flex-direction: column;
          width: max-content;
          gap: 20px;
        }
        .date-place-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .signature-footer {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          justify-content: space-between;
          margin-top: 50px;
        }
      </style>
    </head>
    <body>
      <main>
        <div class="container">
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;">
              <div>
                ${getSVGAsDataURI('/images/logo-suncity-color.svg') ? `<img src="${getSVGAsDataURI('/images/logo-suncity-color.svg')}" alt="Suncity Projects Logo" style="width: auto; height: 40px;" />` : ''}
              </div>
              <div>
                ${getSVGAsDataURI('/images/logo-monarch-color.svg') ? `<img src="${getSVGAsDataURI('/images/logo-monarch-color.svg')}" alt="Suncity's Monarch Residences Logo" style="width: auto; height: 48px;" />` : ''}
              </div>
            </div>
          </div>

          <div class="fields-area">
            <h2 style=" text-transform: uppercase; font-size: 12px; margin: 0;">4. DETAILS OF THE SAID APARTMENT AND ITS PRICING</h2>

            <div class="fields-section">
              <div style="flex: 1 0 0; display: flex;">
                <div style="display: flex; flex-direction: column; gap: 10px; padding: 20px; width: 55%;">
                  <div class="field-row">
                    <div class="label">Tower</div>
                    <div class="value-field">${formData.tower || ''}</div>
                  </div>
                  <div class="field-row">
                    <div class="label">Apartment No.</div>
                    <div class="value-field">${formData.apartmentNumber || ''}</div>
                  </div>
                  <div class="field-row">
                    <div class="label">Type</div>
                    <div class="value-field">${bhkTypeDisplay}</div>
                  </div>
                  <div class="field-row">
                    <div class="label">Floor</div>
                    <div class="value-field">${formData.floor || ''}</div>
                  </div>
                  <div class="field-row">
                    <div class="label" style="width:auto; min-width: 50px;">Carpet Area:</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div class="value-field" style="min-width: 55px;">${formData.carpetAreaSqm || ''}</div>
                      <span style="font-size: 11px;">sq.mtr. (</span>
                      <div class="value-field" style="min-width: 55px;">${formData.carpetAreaSqft || ''}</div>
                      <span style="font-size: 11px;">sq.ft.)</span>
                    </div>
                  </div>
                  <div class="field-row">
                    <div class="label" style="width:auto; min-width: 50px;">Unit Price (in rupees)</div>
                    <div class="value-field"></div>
                  </div>
                  <p style="font-size:12px;">
                    Applicable taxes and cesses payable by the <strong>Applicant(s)</strong> which are in addition to total unit price (this includes GST payable at rates as specified from time to time, which at present is 5%)
                  </p>
                </div>
                <div class="rate-box">
                  <div style="color: #58595b; margin-bottom: 8px; font-size: 11px;">
                    Rate of <b>Said Apartment</b> per square meter*
                  </div>
                  <div style="min-height: 160px;"></div>
                </div>
              </div>
              <div style="display: flex; border-top: 1px solid #58595b">
                <div class="field-row" style="margin-bottom: 0; padding: 15px 20px; width: calc(55% + 1px); border-right: 1px solid #58595b">
                  <div class="label" style="width:auto; min-width:100px">Total Price <span style="font-weight:500">(in rupees)</span></div>
                  <div class="value-field"></div>
                </div>
              </div>

            </div>

            <div class="note-section">
              <h2 style=" text-transform: uppercase; font-size: 12px; margin: 0 0 15px;">*NOTE:</h2>
              <div>
                <div style="margin-bottom: 7px;">
                  1. The <strong>Total Price</strong> for the <strong>Said Apartment</strong> is based on the <strong>Carpet Area</strong>.
                </div>
                <div>
                  2. The <strong>Promoter</strong> has taken the conversion factor of 10.764 sq.ft. per sqm. for the purpose of this <strong>Application</strong> (1 feet = 304.8 mm)
                </div>
              </div>
            </div>

            <div class="declaration-section">
              <h2 style=" text-transform: uppercase; font-size: 12px; margin: 0 0 15px;">5. DECLARATION</h2>
              <div class="declaration-text">
                The <strong>Applicant(s)</strong> hereby declares that the above particulars / information given by the <strong>Applicant(s)</strong> are true and correct and nothing has been concealed therefrom.
              </div>
              <div class="declaration-footer">
                <div style="color: #58595b; font-size: 13px; margin-bottom: 20px;">Yours Faithfully</div>
                <div class="date-place-row">
                  <div class="date-place-item">
                    <label style="color: #58595b; font-size: 12px; flex-shrink: 0;">Date:</label>
                    <div class="value-field" style="min-width: 100px;">${formattedDate}</div>
                  </div>
                  <div class="date-place-item">
                    <label style="color: #58595b; font-size: 12px; flex-shrink: 0;">Place:</label>
                    <div class="value-field" style="min-width: 150px;">${formData.declarationPlace || ''}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          ${renderSignatureFooterHTML(formData)}
        </div>
      </main>
    </body>
    </html>
  `;

  return html;
}
