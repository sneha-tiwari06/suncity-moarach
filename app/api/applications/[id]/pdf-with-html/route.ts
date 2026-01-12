import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import path from 'path';
import fs from 'fs';
import { PDFDocument, PDFImage } from 'pdf-lib';
import puppeteer from 'puppeteer';
import { renderApplicantFormHTML, renderApartmentFormHTML } from '@/lib/html-renderer';
import { page21ImageCoordinates } from '@/lib/pdf-coordinates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser;
  try {
    await connectDB();

    const { id } = await params;
    const application = await Application.findById(id)
      .select('formData applicantCount bhkType')
      .lean();

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const formData = JSON.parse(application.formData);
    const applicantCount = application.applicantCount || 1;
    const bhkType = application.bhkType;

    // Read the original PDF
    const pdfPath = path.join(process.cwd(), 'public', 'form.pdf');
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'Original PDF not found' },
        { status: 404 }
      );
    }

    const originalPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDoc.getPages();
    const numPages = pages.length;

    // Helper function to get image for BHK type
    const getImageForBHK = async (bhkType: string): Promise<Uint8Array | null> => {
      try {
        const imageFolder = path.join(process.cwd(), 'public', 'images', bhkType.toLowerCase());
        
        if (!fs.existsSync(imageFolder)) {
          console.warn(`Image folder not found: ${imageFolder}`);
          return null;
        }
        
        const files = fs.readdirSync(imageFolder).filter(file => 
          /\.(jpg|jpeg|png|gif)$/i.test(file)
        );
        
        if (files.length === 0) {
          console.warn(`No image found in ${imageFolder}`);
          return null;
        }
        
        const imagePath = path.join(imageFolder, files[0]);
        const imageBytes = fs.readFileSync(imagePath);
        return new Uint8Array(imageBytes);
      } catch (error) {
        console.error(`Error loading image for ${bhkType}:`, error);
        return null;
      }
    };

    // Fill Page 21 with BHK Image (if bhkType exists)
    if (bhkType && pages[20]) {
      const imageBytes = await getImageForBHK(bhkType);
      if (imageBytes) {
        try {
          // Determine image type and embed
          let image: PDFImage;
          try {
            image = await pdfDoc.embedPng(imageBytes);
          } catch {
            image = await pdfDoc.embedJpg(imageBytes);
          }
          
          const page21 = pages[20];
          const pageHeight = page21.getHeight();
          const adjustedY = pageHeight - page21ImageCoordinates.y - page21ImageCoordinates.height;
          
          // Draw the image on page 21
          page21.drawImage(image, {
            x: page21ImageCoordinates.x,
            y: adjustedY,
            width: page21ImageCoordinates.width,
            height: page21ImageCoordinates.height,
          });
        } catch (error) {
          console.error('Error embedding BHK image on page 21:', error);
        }
      }
    }

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const htmlPages: Uint8Array[] = [];

    // Helper function to generate PDF from HTML
    const generatePDFFromHTML = async (html: string): Promise<Uint8Array> => {
      const page = await browser!.newPage();
      try {
        // Set timeout for navigation (10 seconds should be more than enough for static HTML)
        page.setDefaultNavigationTimeout(10000);
        page.setDefaultTimeout(10000);
        await page.setViewport({ width: 612, height: 792, deviceScaleFactor: 1 });
        // Use 'load' instead of 'networkidle0' - much faster for static HTML content
        // 'load' waits for the load event, perfect for static HTML with no external resources
        await page.setContent(html, { waitUntil: 'load' });
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });
        return new Uint8Array(pdf);
      } finally {
        await page.close();
      }
    };

    // Generate HTML pages for 5-8 and convert to PDF
    // Page 5 - Applicant 1
    if (applicantCount >= 1 && formData.applicants[0]) {
      const html = renderApplicantFormHTML(formData.applicants[0], 1, formData);
      const pdf = await generatePDFFromHTML(html);
      htmlPages.push(pdf);
    }

    // Page 6 - Applicant 2
    if (applicantCount >= 2 && formData.applicants[1] && formData.applicants[1].name) {
      const html = renderApplicantFormHTML(formData.applicants[1], 2, formData);
      const pdf = await generatePDFFromHTML(html);
      htmlPages.push(pdf);
    }

    // Page 7 - Applicant 3
    if (applicantCount >= 3 && formData.applicants[2] && formData.applicants[2].name) {
      const html = renderApplicantFormHTML(formData.applicants[2], 3, formData);
      const pdf = await generatePDFFromHTML(html);
      htmlPages.push(pdf);
    }

    // Page 8 - Apartment Declaration
    const html = renderApartmentFormHTML(formData);
    const pdf = await generatePDFFromHTML(html);
    htmlPages.push(pdf);

    await browser.close();
    browser = null;

    // Create a new PDF document to merge pages
    const mergedPdf = await PDFDocument.create();

    // Copy pages 1-4 from original PDF
    for (let i = 0; i < 4 && i < pages.length; i++) {
      const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [i]);
      mergedPdf.addPage(copiedPage);
    }

    // Add HTML-generated pages (5-8)
    for (const htmlPdfBytes of htmlPages) {
      const htmlPdf = await PDFDocument.load(htmlPdfBytes);
      const htmlPageCount = htmlPdf.getPageCount();
      const pageIndices = Array.from({ length: htmlPageCount }, (_, i) => i);
      const copiedPages = await mergedPdf.copyPages(htmlPdf, pageIndices);
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Copy pages 9+ from original PDF
    for (let i = 8; i < pages.length; i++) {
      const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [i]);
      mergedPdf.addPage(copiedPage);
    }

    // Generate the final PDF
    const finalPdfBytes = await mergedPdf.save();
    const pdfBuffer = Buffer.from(finalPdfBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="application-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF with HTML:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
      browser = null;
    }
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
