# PDF Coordinate Calibration Guide

## Issue
The current PDF coordinates in `lib/pdf-coordinates.ts` are **placeholder values** and need to be calibrated based on the actual PDF layout.

## Problem
When data is filled in the PDF, it appears in the wrong position (e.g., below the fields instead of inside them). This is because the coordinates don't match the actual PDF layout.

## Solution: Calibrate Coordinates

### Method 1: Using PDF Annotation Tools

1. **Open the PDF in a PDF editor** (Adobe Acrobat, Foxit, or online tools)
2. **Enable measurement tools** or use annotation tools
3. **Measure each field's position**:
   - X position (from left edge)
   - Y position (from bottom edge for PDF coordinates)
   - Width (field width)
   - Height (field height)

### Method 2: Using pdf-lib to Find Coordinates

You can create a test script to overlay shapes on the PDF and visually identify field positions:

```typescript
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function findCoordinates() {
  const pdfBytes = fs.readFileSync('public/form.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[4]; // Page 5 (0-indexed is 4)
  
  const pageHeight = page.getHeight();
  
  // Draw a test rectangle at a suspected position
  // Adjust x, y, width, height until it aligns with a field
  page.drawRectangle({
    x: 100,
    y: pageHeight - 700 - 15, // Adjust Y from top (700) to bottom
    width: 200,
    height: 15,
    borderColor: rgb(1, 0, 0), // Red border
    borderWidth: 1,
  });
  
  const modifiedPdf = await pdfDoc.save();
  fs.writeFileSync('test-coordinates.pdf', modifiedPdf);
}
```

### Method 3: Iterative Testing

1. Start with estimated coordinates
2. Generate a test PDF with filled data
3. Compare with original PDF
4. Adjust coordinates incrementally
5. Repeat until alignment is perfect

## Important Notes

### PDF Coordinate System
- **Origin**: Bottom-left corner (0, 0)
- **X-axis**: Increases to the right
- **Y-axis**: Increases upward
- **Units**: Points (1/72 inch)

### Character Box Calculations
- Each field typically has **25 character boxes** (based on the PDF layout)
- Box width = `fieldWidth / maxCharacters`
- Box height = `fieldHeight`
- Box spacing = 0 (adjacent boxes)

### Field Positions (Page 5 Example)

Based on the form image, typical positions:
- **Title field**: Top-left, ~5 characters (Mr./Mrs./Ms./M/s.)
- **Name field**: After title, ~25 characters
- **Son/Wife/Daughter of**: Next line, ~25 characters
- **Nationality**: Next line, ~25 characters
- **Age**: Next line, ~3 characters
- **DOB**: Same line as Age, ~10 characters
- **Profession**: Next line, ~25 characters
- **Aadhaar**: Next line, ~12 characters
- **Residential Status**: Checkboxes (handle differently)
- **PAN**: Next line, ~10 characters
- **IT Ward**: Next line, ~30 characters
- **Correspondence Address**: Multi-line (3 lines × 25 chars)
- **Tel No.**: Next line, ~15 characters
- **Mobile**: Same line as Tel No., ~10 characters
- **Email**: Next line, ~30 characters

## Update Coordinates

Once you have the correct coordinates, update `lib/pdf-coordinates.ts`:

```typescript
export const page5Fields: PageFields = {
  applicant1Title: { 
    x: <measured_x>, 
    y: <measured_y_from_top>, // Will be converted to bottom in calculateBoxConfig
    width: <measured_width>, 
    height: <measured_height>, 
    fontSize: 10,
    maxChars: 5 // Title is short
  },
  applicant1Name: { 
    x: <measured_x>, 
    y: <measured_y_from_top>,
    width: <measured_width>, 
    height: <measured_height>, 
    fontSize: 10,
    maxChars: 25
  },
  // ... continue for all fields
};
```

## Testing

After updating coordinates:
1. Fill the form with test data
2. Submit and generate PDF
3. Compare generated PDF with original
4. Verify each character is in the correct box
5. Adjust coordinates as needed
