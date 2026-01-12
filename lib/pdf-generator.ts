import { PDFDocument, PDFPage, PDFImage, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { formCoordinates, signatureCoordinates, page21ImageCoordinates } from './pdf-coordinates';
import { FormData } from './types';
import { pdfFieldConfigs, PDFFieldConfig } from './pdf-field-config';
import { fillFieldWithOverflow, formatFieldValue } from './pdf-overflow-handler';

export async function generateFilledPDF(
  originalPdfBytes: Uint8Array,
  formData: FormData,
  applicantCount: number,
  bhkType: string,
  getImageForBHK: (bhkType: string) => Promise<Uint8Array | null>
): Promise<Uint8Array> {
  
  // Load the PDF document
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  
  // Get all pages
  const pages = pdfDoc.getPages();
  
  // Embed font - pdf-lib doesn't support extracting existing fonts from PDF
  // Using Helvetica (standard PDF font) for consistent rendering
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Fill Page 5 - Applicant 1
  if (applicantCount >= 1 && pages[4]) {
    await fillPageWithConfig(pages[4], pdfFieldConfigs, formData.applicants[0], 5, font);
    // Use Applicant 1's signature
    await fillSignature(pages[4], formData.applicants[0]?.signature, signatureCoordinates[5], pdfDoc);
  }
  
  // Fill Page 6 - Applicant 2
  if (applicantCount >= 2 && pages[5]) {
    await fillPageWithConfig(pages[5], pdfFieldConfigs, formData.applicants[1], 6, font);
    // Use Applicant 2's signature
    await fillSignature(pages[5], formData.applicants[1]?.signature, signatureCoordinates[6], pdfDoc);
  }
  
  // Fill Page 7 - Applicant 3
  if (applicantCount >= 3 && pages[6]) {
    await fillPageWithConfig(pages[6], pdfFieldConfigs, formData.applicants[2], 7, font);
    // Use Applicant 3's signature
    await fillSignature(pages[6], formData.applicants[2]?.signature, signatureCoordinates[7], pdfDoc);
  }
  
  // Fill Page 8 - Apartment Details & Declaration
  if (pages[7]) {
    await fillPage8WithConfig(pages[7], pdfFieldConfigs, formData, 8, font);
    // Use Applicant 1's signature for declaration (or first available applicant)
    const declarationSignature = formData.applicants[0]?.signature || 
                                 formData.applicants[1]?.signature || 
                                 formData.applicants[2]?.signature;
    await fillSignature(pages[7], declarationSignature, signatureCoordinates[8], pdfDoc);
  }
  
  // Fill Page 21 - Add BHK Image
  if (bhkType && pages[20]) {
    const imageBytes = await getImageForBHK(bhkType);
    if (imageBytes) {
      await fillPage21Image(pages[20], imageBytes, page21ImageCoordinates, pdfDoc);
    }
  }
  
  // Ensure A4 dimensions (612 × 792 points) - enforce on all pages
  pages.forEach(page => {
    const pageSize = page.getSize();
    if (pageSize.width !== 612 || pageSize.height !== 792) {
      page.setSize(612, 792); // Force A4 size
    }
  });
  
  // Save the PDF with compression disabled for pixel-perfect output
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return pdfBytes;
}

/**
 * Fill page using field configuration system with overflow handling
 */
async function fillPageWithConfig(
  page: PDFPage,
  configs: PDFFieldConfig[],
  applicantData: any,
  pageNumber: number,
  font: PDFFont
): Promise<void> {
  const pageHeight = page.getHeight();
  
  // Get all field configs for this page (excluding page 8 which is handled separately)
  const pageConfigs = configs.filter(config => config.page === pageNumber);
  
  for (const config of pageConfigs) {
    const fieldValue = applicantData[config.field];
    if (!fieldValue) continue;
    
    // Format value based on field type
    const formattedValue = formatFieldValue(config.field, String(fieldValue));
    
    // Fill field with overflow handling
    await fillFieldWithOverflow(page, formattedValue, config, font, pageHeight);
  }
}

/**
 * Fill page 8 (Apartment Details) using field configuration
 */
async function fillPage8WithConfig(
  page: PDFPage,
  configs: PDFFieldConfig[],
  formData: FormData,
  pageNumber: number,
  font: PDFFont
): Promise<void> {
  const pageHeight = page.getHeight();
  
  // Get all field configs for page 8
  const pageConfigs = configs.filter(config => config.page === pageNumber);
  
  for (const config of pageConfigs) {
    let fieldValue: string | undefined;
    
    // Map field names to formData properties
    if (config.field === 'bhkType') {
      fieldValue = formData.bhkType || '';
      if (fieldValue === '3bhk') fieldValue = '3 BHK';
      if (fieldValue === '4bhk') fieldValue = '4 BHK';
    } else if (config.field === 'apartmentNumber' || config.field === 'unitNumber') {
      fieldValue = formData.apartmentNumber || formData.unitNumber || '';
    } else {
      fieldValue = (formData as any)[config.field] || '';
    }
    
    if (!fieldValue) continue;
    
    // Format value
    const formattedValue = formatFieldValue(config.field, String(fieldValue));
    
    // Fill field with overflow handling
    await fillFieldWithOverflow(page, formattedValue, config, font, pageHeight);
  }
}

// Map PDF coordinate field names to ApplicantData field names
function mapFieldName(pdfFieldName: string): string {
  const fieldMap: { [key: string]: string } = {
    // Applicant 1 fields
    'applicant1Title': 'title',
    'applicant1Name': 'name',
    'applicant1FatherName': 'sonWifeDaughterOf',
    'applicant1Nationality': 'nationality',
    'applicant1Age': 'age',
    'applicant1DOB': 'dob',
    'applicant1Profession': 'profession',
    'applicant1Aadhaar': 'aadhaar',
    'applicant1ResidentialStatus': 'residentialStatus',
    'applicant1Pan': 'pan',
    'applicant1ItWard': 'itWard',
    'applicant1CorrespondenceAddress': 'correspondenceAddress',
    'applicant1Address': 'address',
    'applicant1City': 'city',
    'applicant1State': 'state',
    'applicant1Pincode': 'pincode',
    'applicant1TelNo': 'telNo',
    'applicant1Phone': 'phone',
    'applicant1Email': 'email',
    
    // Applicant 2 fields (same pattern)
    'applicant2Title': 'title',
    'applicant2Name': 'name',
    'applicant2FatherName': 'sonWifeDaughterOf',
    'applicant2Nationality': 'nationality',
    'applicant2Age': 'age',
    'applicant2DOB': 'dob',
    'applicant2Profession': 'profession',
    'applicant2Aadhaar': 'aadhaar',
    'applicant2ResidentialStatus': 'residentialStatus',
    'applicant2Pan': 'pan',
    'applicant2ItWard': 'itWard',
    'applicant2CorrespondenceAddress': 'correspondenceAddress',
    'applicant2Address': 'address',
    'applicant2City': 'city',
    'applicant2State': 'state',
    'applicant2Pincode': 'pincode',
    'applicant2TelNo': 'telNo',
    'applicant2Phone': 'phone',
    'applicant2Email': 'email',
    
    // Applicant 3 fields (same pattern)
    'applicant3Title': 'title',
    'applicant3Name': 'name',
    'applicant3FatherName': 'sonWifeDaughterOf',
    'applicant3Nationality': 'nationality',
    'applicant3Age': 'age',
    'applicant3DOB': 'dob',
    'applicant3Profession': 'profession',
    'applicant3Aadhaar': 'aadhaar',
    'applicant3ResidentialStatus': 'residentialStatus',
    'applicant3Pan': 'pan',
    'applicant3ItWard': 'itWard',
    'applicant3CorrespondenceAddress': 'correspondenceAddress',
    'applicant3Address': 'address',
    'applicant3City': 'city',
    'applicant3State': 'state',
    'applicant3Pincode': 'pincode',
    'applicant3TelNo': 'telNo',
    'applicant3Phone': 'phone',
    'applicant3Email': 'email',
  };
  
  // Try direct mapping first
  if (fieldMap[pdfFieldName]) {
    return fieldMap[pdfFieldName];
  }
  
  // Fallback: remove applicant prefix and convert to camelCase
  const withoutPrefix = pdfFieldName.replace(/^applicant\d+/, '');
  if (withoutPrefix) {
    return withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1);
  }
  
  return pdfFieldName.toLowerCase();
}

async function fillPageFields(
  page: PDFPage,
  fields: any,
  applicantData: any,
  pdfDoc: PDFDocument
) {
  // Use standard font (Helvetica is built-in)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const pageHeight = page.getHeight();
  
  Object.entries(fields).forEach(([fieldName, fieldCoord]: [string, any]) => {
    // Map PDF field name to ApplicantData field name
    const mappedFieldName = mapFieldName(fieldName);
    let value = applicantData[mappedFieldName] || '';
    
    // Handle title field separately (Title is its own field in the PDF, not combined with name)
    // Title field should be handled separately with its own coordinates
    
    if (value) {
      // Determine max characters based on field type (25 is default based on PDF layout)
      let maxChars = 25; // Default for most fields
      
      // Field-specific character limits
      if (fieldName.includes('Title')) maxChars = 5; // Mr./Mrs./Ms./M/s.
      if (fieldName.includes('Email')) maxChars = 30;
      if (fieldName.includes('Aadhaar')) maxChars = 12; // 12 digits
      if (fieldName.includes('Pan')) maxChars = 10; // 10 characters
      if (fieldName.includes('Phone') || fieldName.includes('Mobile')) maxChars = 10; // 10 digits
      if (fieldName.includes('TelNo')) maxChars = 15;
      if (fieldName.includes('Age')) maxChars = 3;
      if (fieldName.includes('DOB') || fieldName.includes('dob')) maxChars = 10; // DD/MM/YYYY
      if (fieldName.includes('Pincode')) maxChars = 6; // 6 digits
      if (fieldName.includes('ItWard')) maxChars = 30;
      
      // Format dates if needed
      if (fieldName.includes('DOB') || fieldName.includes('dob')) {
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Convert YYYY-MM-DD to DD/MM/YYYY
          const [year, month, day] = value.split('-');
          value = `${day}/${month}/${year}`;
        }
      }
      
      // Format Aadhaar (12 digits with spaces: XXXX XXXX XXXX)
      if (fieldName.includes('Aadhaar') && value.length >= 12) {
        const digits = value.replace(/\s/g, '').slice(0, 12);
        value = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
        maxChars = 14; // Include spaces
      }
      
      // For multi-line fields like address, handle line breaks
      if (fieldName.includes('Address') || fieldName.includes('Correspondence')) {
        // Split address into lines (approximately 25 chars per line based on PDF)
        const addressLines = splitIntoLines(value, 25, 3); // Max 3 lines
        addressLines.forEach((line, lineIndex) => {
          // In PDF coordinates, Y increases upward, so to move down we subtract
          // fieldCoord.y is from top, but we need to adjust for line spacing
          const lineConfig = calculateBoxConfig(
            {
              ...fieldCoord,
              y: fieldCoord.y - (lineIndex * fieldCoord.height), // Stack lines vertically (subtract Y to move down)
              maxChars: 25,
            },
            pageHeight
          );
          fillCharacterBoxes(page, line, lineConfig, font, fontSize);
        });
      } else {
        // Single-line field: fill character by character
        const boxConfig = calculateBoxConfig(
          { ...fieldCoord, maxChars },
          pageHeight,
          maxChars
        );
        fillCharacterBoxes(page, String(value), boxConfig, font, fontSize);
      }
    }
  });
}

/**
 * Split text into multiple lines based on max line length
 */
function splitIntoLines(text: string, maxLineLength: number, maxLines: number): string[] {
  const lines: string[] = [];
  const words = text.split(' ');
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxLineLength) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than maxLineLength, truncate it
        lines.push(word.slice(0, maxLineLength));
        currentLine = '';
      }
    }
    
    if (lines.length >= maxLines) break;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

async function fillPage8Fields(
  page: PDFPage,
  fields: any,
  formData: FormData,
  pdfDoc: PDFDocument
) {
  // Use standard font (Helvetica is built-in)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const pageHeight = page.getHeight();
  
  Object.entries(fields).forEach(([fieldName, fieldCoord]: [string, any]) => {
    let value = '';
    
    // Map field names to formData properties
    if (fieldName === 'bhkType') {
      value = formData.bhkType || '';
      if (value === '3bhk') value = '3 BHK';
      if (value === '4bhk') value = '4 BHK';
    } else if (fieldName === 'unitNumber' || fieldName === 'apartmentNumber') {
      value = formData.apartmentNumber || formData.unitNumber || '';
    } else if (fieldName === 'tower') {
      value = formData.tower || '';
    } else if (fieldName === 'floor') {
      value = formData.floor || '';
    } else if (fieldName === 'carpetAreaSqm') {
      value = formData.carpetAreaSqm || '';
    } else if (fieldName === 'carpetAreaSqft') {
      value = formData.carpetAreaSqft || '';
    } else if (fieldName === 'unitPrice') {
      value = formData.unitPrice || '';
      // Remove currency symbols and formatting for character boxes
      value = value.replace(/[₹,\s]/g, '').trim();
    } else if (fieldName === 'totalPrice') {
      value = formData.totalPrice || '';
      value = value.replace(/[₹,\s]/g, '').trim();
    } else if (fieldName === 'declarationDate') {
      value = formData.declarationDate || '';
      // Format date if needed (YYYY-MM-DD to DD/MM/YYYY)
      if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = value.split('-');
        value = `${day}/${month}/${year}`;
      }
    } else if (fieldName === 'declarationPlace') {
      value = formData.declarationPlace || '';
    } else {
      // Try direct access to formData
      value = (formData as any)[fieldName] || '';
    }
    
    if (value) {
      // Determine max characters based on field type
      let maxChars = 25; // Default
      if (fieldName.includes('Price')) maxChars = 15;
      if (fieldName.includes('Date')) maxChars = 10;
      if (fieldName.includes('Area')) maxChars = 10;
      if (fieldName.includes('Tower')) maxChars = 15;
      if (fieldName.includes('Floor')) maxChars = 15;
      
      // Fill character by character
      const boxConfig = calculateBoxConfig(
        { ...fieldCoord, maxChars },
        pageHeight,
        maxChars
      );
      fillCharacterBoxes(page, String(value), boxConfig, font, fontSize);
    }
  });
}

async function fillSignature(
  page: PDFPage,
  signatureBase64: string | undefined,
  signatureCoord: any,
  pdfDoc: PDFDocument
) {
  if (!signatureBase64) return;
  
  try {
    // Remove data URL prefix if present
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(Buffer.from(base64Data, 'base64'));
    
    // Embed the image
    let image: PDFImage;
    if (signatureBase64.startsWith('data:image/png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      image = await pdfDoc.embedJpg(imageBytes);
    }
    
    const pageHeight = page.getHeight();
    const adjustedY = pageHeight - signatureCoord.y - signatureCoord.height;
    
    // Draw the signature image
    page.drawImage(image, {
      x: signatureCoord.x,
      y: adjustedY,
      width: signatureCoord.width,
      height: signatureCoord.height,
    });
  } catch (error) {
    console.error('Error embedding signature:', error);
  }
}

async function fillPage21Image(
  page: PDFPage,
  imageBytes: Uint8Array,
  imageCoord: any,
  pdfDoc: PDFDocument
) {
  try {
    // Determine image type and embed
    // Try PNG first, then JPG
    let image: PDFImage;
    try {
      image = await pdfDoc.embedPng(imageBytes);
    } catch {
      image = await pdfDoc.embedJpg(imageBytes);
    }
    
    const pageHeight = page.getHeight();
    const adjustedY = pageHeight - imageCoord.y - imageCoord.height;
    
    // Draw the image
    page.drawImage(image, {
      x: imageCoord.x,
      y: adjustedY,
      width: imageCoord.width,
      height: imageCoord.height,
    });
  } catch (error) {
    console.error('Error embedding image:', error);
  }
}
