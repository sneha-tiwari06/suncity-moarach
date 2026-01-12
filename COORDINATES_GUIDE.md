# PDF Field Coordinates Calibration Guide

## Overview

This document explains how to calibrate the PDF field coordinates for pixel-perfect alignment. The coordinates in `lib/pdf-coordinates.ts` need to match the exact positions of fields in your PDF.

## PDF Coordinate System

- **Origin**: Bottom-left corner (0, 0)
- **Unit**: Points (1 point = 1/72 inch = 0.3528 mm)
- **Standard A4**: 612 x 792 points (8.5 x 11 inches)
- **X-axis**: Increases to the right
- **Y-axis**: Increases upward

## How to Find Field Coordinates

### Method 1: Using PDF Annotation Tools

1. Open your PDF in Adobe Acrobat Pro or similar tool
2. Use the measuring tools to find field positions
3. Create annotations to mark field boundaries
4. Read the coordinates from the annotation properties

### Method 2: Using pdf-lib Inspection

Create a debug script to inspect PDF pages:

```typescript
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function inspectPDF() {
  const pdfBytes = fs.readFileSync('public/form.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  
  // Get page 5 (index 4)
  const page = pages[4];
  const { width, height } = page.getSize();
  
  console.log(`Page 5 dimensions: ${width} x ${height} points`);
  
  // Draw a test rectangle at a position
  page.drawRectangle({
    x: 100,
    y: 700,
    width: 200,
    height: 15,
    borderColor: rgb(1, 0, 0),
    borderWidth: 1,
  });
  
  // Save debug PDF
  const modifiedPdf = await pdfDoc.save();
  fs.writeFileSync('debug.pdf', modifiedPdf);
}
```

### Method 3: Visual Alignment Testing

1. Start with approximate coordinates
2. Fill the form in the web interface
3. Check the generated PDF
4. Adjust coordinates based on visual alignment
5. Iterate until pixel-perfect

## Field Coordinate Format

Each field in `lib/pdf-coordinates.ts` follows this structure:

```typescript
{
  x: number,        // Horizontal position from left edge (in points)
  y: number,        // Vertical position from BOTTOM edge (in points)
  width: number,    // Field width (in points)
  height: number,   // Field height (in points)
  fontSize?: number, // Optional font size (default: 10)
  fontName?: string  // Optional font name (default: Helvetica)
}
```

## Important Notes

1. **Y-coordinate is from bottom**: PDF coordinates use bottom-left origin, so:
   - `y: 700` means 700 points from the bottom
   - To position near the top (e.g., 50 points from top), use `y: pageHeight - 50 - height`

2. **Field naming convention**: 
   - Page 5: `applicant1*` fields
   - Page 6: `applicant2*` fields
   - Page 7: `applicant3*` fields
   - Page 8: `bhkType`, `unitNumber`, etc.

3. **Multi-line fields**: For address fields that span multiple lines:
   - Increase `height` value
   - Use `\n` in text to create line breaks
   - Adjust Y position to accommodate multiple lines

## Common Field Positions

Based on standard form layouts, typical positions are:

- **Header fields** (name, etc.): y = 650-750
- **Body fields** (address, etc.): y = 400-600
- **Footer fields** (signature, etc.): y = 50-150

## Signature Fields

Signature fields appear on pages 5, 6, 7, and 8. They typically have:
- Larger dimensions (width: 150-200, height: 50-80)
- Position near bottom of page (y: 50-150)
- Right-aligned or centered

## Page 21 Image Coordinates

The BHK plan image on page 21 (SCHEDULE - B) needs coordinates:
- Position after the "SCHEDULE - B" heading
- Typically: y = 400-500 (from bottom)
- Size depends on image dimensions (adjust width/height proportionally)

## Calibration Checklist

- [ ] Page 5 - Applicant 1 fields calibrated
- [ ] Page 6 - Applicant 2 fields calibrated
- [ ] Page 7 - Applicant 3 fields calibrated
- [ ] Page 8 - BHK selection field calibrated
- [ ] Signature fields on all pages calibrated
- [ ] Page 21 image position calibrated
- [ ] Font sizes adjusted for readability
- [ ] Text alignment verified
- [ ] Print output validated

## Testing Coordinates

After updating coordinates:

1. Fill out the form completely
2. Generate PDF
3. Compare with original PDF
4. Check print output (Ctrl+P)
5. Verify:
   - No text overlap
   - Proper alignment
   - Readable font sizes
   - Correct margins
   - Pixel-perfect match

## Troubleshooting

**Fields appear too high:**
- Decrease Y coordinate (move down from bottom)

**Fields appear too low:**
- Increase Y coordinate (move up from bottom)

**Fields appear too left:**
- Decrease X coordinate

**Fields appear too right:**
- Increase X coordinate

**Text too large/small:**
- Adjust `fontSize` property

**Text gets cut off:**
- Increase `width` or `height`
- Adjust position

## Example: Calibrating a Name Field

1. Open PDF in viewer
2. Measure: Name field starts 100 points from left, 700 points from bottom
3. Measure: Field is 200 points wide, 15 points tall
4. Update coordinate:
   ```typescript
   applicant1Name: { x: 100, y: 700, width: 200, height: 15, fontSize: 10 }
   ```
5. Test in application
6. Adjust if needed
