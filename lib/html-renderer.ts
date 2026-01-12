import { FormData, ApplicantData } from './types';
import fs from 'fs';
import path from 'path';
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
 */
function renderCharacterBoxesHTML(value: string, boxCount: number = 20, boxWidth: number = APPLICANT_BOX_WIDTH): string {
  const boxHeight = APPLICANT_BOX_HEIGHT; // 20px
  const borderWidth = APPLICANT_BORDER_WIDTH; // 1px
  const chars = value ? value.toString().split('').slice(0, boxCount) : [];

  const boxes = Array.from({ length: boxCount }, (_, i) => {
    const char = chars[i] || '';
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
      overflow: hidden;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1px;
      flex-direction: row;
    ">${boxes}</div>
  `;
}

/**
 * Render signature footer HTML - matches preview page exactly
 */
function renderSignatureFooterHTML(formData: FormData): string {
  const hasFirstSignature = formData.applicants[0]?.signature;
  const hasSecondSignature = formData.applicants[1]?.signature;

  if (!hasFirstSignature && !hasSecondSignature) return '';

  let html = '<div style="padding-top: 12px; display: flex; align-items: flex-start; gap: 40px; align-self: end;">';

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
          <div style="border: 1px dashed #ee1e23; background-color: white; border-radius: 12px; width: 170px; height: 45px; display: flex; align-items: center; justify-content: center;">
            <img src="${formData.applicants[0].signature}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        </div>
      </div>
    `;
  }

  if (hasSecondSignature) {
    html += `
      <div>
        <div style="margin-bottom: 4px; text-align: center;">
          <span style="color: #58595b; font-style: italic; font-size: 11px;">Second Applicant, if any</span>
        </div>
        <div style="margin-bottom: 4px;">
          <label style="font-weight: bold; color: #58595b; font-size: 11px;">Signature:</label>
        </div>
        <div style="border: 1px dashed #ee1e23; background-color: white; width: 170px; height: 45px; display: flex; align-items: center; justify-content: center;">
          <img src="${formData.applicants[1].signature}" alt="Second Applicant Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
      </div>
    `;
  }

  html += '</div>';
  return html;
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
 * Render applicant form HTML (Page 5, 6, 7)
 */
export function renderApplicantFormHTML(applicant: ApplicantData, applicantNumber: number, formData: FormData): string {
  if (!applicant || (!applicant.name && applicantNumber > 1)) return '';

  const titleName = `${applicant.name || ''}`.trim() || '';
  const residentialStatus = applicant.residentialStatus || '';
  
  // Split multi-line fields
  const itWardLines = (applicant.itWard || '').match(/.{1,20}/g) || [];
  const addressLines = (applicant.correspondenceAddress || '').match(/.{1,20}/g) || [];

  const html = `
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
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
          max-height: ${CONTAINER_HEIGHT}mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          background: white;
          overflow: hidden;
          color: #58595b;
        }
        main{
          padding: 24px;
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
          max-height: ${CONTAINER_HEIGHT}mm;
        }
        .container {
          width: 100%;
          padding: 20px;
          border: 1px solid #58595b;
          overflow: hidden;
          box-sizing: border-box;
          height: 100%;
          display: grid;
          grid-template-rows: 86px auto auto;
        }
        .header {
          margin-bottom: 24px;
        }
        .field-row {
          display: flex;
          align-items: center;
          gap: ${APPLICANT_FIELD_GAP}px;
          margin-bottom: 6px;
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
          margin-bottom: 12px;
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
          aspect-ratio: 3/4;
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
                ${applicantNumber}. ${applicantNumber === 1 ? 'SOLE OR FIRST APPLICANT(S):-' : `JOINT APPLICANT ${applicantNumber - 1}:-`}
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
                <div class="field-row">
                  <div class="label">Age:</div>
                  ${renderCharacterBoxesHTML(applicant.age || '', 20, APPLICANT_BOX_WIDTH)}
                </div>
                <div class="field-row">
                  <div class="label">DOB:</div>
                  ${renderCharacterBoxesHTML(applicant.dob || '', 20, APPLICANT_BOX_WIDTH)}
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
                  ${Array.from({ length: 2 }, (_, i) => {
                    const lineValue = itWardLines[i] || '';
                    return `<div>${renderCharacterBoxesHTML(lineValue, 23, APPLICANT_BOX_WIDTH)}</div>`;
                  }).join('')}
                </div>
              </div>
              <div class="field-row" style="align-items: flex-start;">
                <div class="label" style="padding-top: 4px;">Correspondence Address:</div>
                <div class="multi-line-field">
                  ${Array.from({ length: 3 }, (_, i) => {
                    const lineValue = addressLines[i] || '';
                    return `<div>${renderCharacterBoxesHTML(lineValue, 28, APPLICANT_BOX_WIDTH)}</div>`;
                  }).join('')}
                </div>
              </div>
              <div class="field-row">
                <div class="label">Tel No.:</div>
                ${renderCharacterBoxesHTML(applicant.telNo || '', 28, APPLICANT_BOX_WIDTH)}
              </div>
              <div class="field-row">
                <div class="label">Mobile:</div>
                ${renderCharacterBoxesHTML(applicant.phone || '', 28, APPLICANT_BOX_WIDTH)}
              </div>
              <div class="field-row">
                <div class="label">E-Mail ID:</div>
                ${renderCharacterBoxesHTML(applicant.email || '', 28, APPLICANT_BOX_WIDTH)}
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

/**
 * Render apartment form HTML (Page 8)
 */
export function renderApartmentFormHTML(formData: FormData): string {
  const bhkTypeDisplay = formData.bhkType === '3bhk' ? '3 BHK' : formData.bhkType === '4bhk' ? '4 BHK' : '';
  const unitPriceClean = formData.unitPrice ? formData.unitPrice.replace(/[₹,]/g, '') : '';
  const totalPriceClean = formData.totalPrice ? formData.totalPrice.replace(/[₹,]/g, '') : '';

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
          max-height: ${CONTAINER_HEIGHT}mm;
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 13px;
          background: white;
          overflow: hidden;
          color: #58595b;
        }
        main{
          padding: 24px;
          width: ${CONTAINER_WIDTH}mm;
          max-width: ${CONTAINER_WIDTH}mm;
          min-width: ${CONTAINER_WIDTH}mm;
          height: ${CONTAINER_HEIGHT}mm;
          min-height: ${CONTAINER_HEIGHT}mm;
          max-height: ${CONTAINER_HEIGHT}mm;
        }
        .container {
          width: 100%;
          padding: 20px;
          border: 1px solid #58595b;
          overflow: hidden;
          box-sizing: border-box;
          height: 100%;
          display: grid;
          grid-template-rows: 86px auto auto;
        }
        .header {
          margin-bottom: 24px;
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
        .label {åå
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
                    <div class="value-field">${unitPriceClean}</div>
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
                  <div class="value-field">${totalPriceClean}</div>
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
