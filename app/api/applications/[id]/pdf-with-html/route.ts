import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { renderApplicantFormHTML, renderApartmentFormHTML, renderSignatureFooterOverlayHTML } from '@/lib/html-renderer';
import { ApplicantData } from '@/lib/types';
import { hasApplicant3Data } from '@/lib/applicant-utils';

// Detect production environment
const isProduction = process.env.VERCEL === '1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser;
  try {
    await connectDB();

    const { id } = await params;
    
    // Support both MongoDB _id and readable applicationId (SUNMON-XXXXXX)
    let application;
    if (id.startsWith('SUNMON-')) {
      application = await Application.findOne({ applicationId: id })
        .select('formData applicantCount bhkType')
        .lean();
    } else {
      application = await Application.findById(id)
        .select('formData applicantCount bhkType')
        .lean();
    }

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


    // Launch Puppeteer browser
    // Use serverless Chrome on Vercel, regular Puppeteer locally
    let puppeteerInstance: any;
    let chromiumInstance: any;
    
    if (isProduction) {
      // Production: Use puppeteer-core with @sparticuz/chromium (Vercel-safe)
      puppeteerInstance = (await import('puppeteer-core')).default;
      chromiumInstance = await import('@sparticuz/chromium');
      browser = await puppeteerInstance.launch({
        args: chromiumInstance.default.args,
        defaultViewport: chromiumInstance.default.defaultViewport,
        executablePath: await chromiumInstance.default.executablePath(),
        headless: chromiumInstance.default.headless,
      });
    } else {
      // Local development: Use regular Puppeteer (has Chromium bundled)
      puppeteerInstance = (await import('puppeteer')).default;
      browser = await puppeteerInstance.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }

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
    // Page 5 - Applicant 1 (only show if name exists - now optional when skipping to third applicant)
    if (formData.applicants[0] && formData.applicants[0].name && formData.applicants[0].name.trim() !== '') {
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
    // Show if any data is present (name or company fields), regardless of applicant 2
    // Check if applicant 3 exists in the array (at index 2) and has data
    if (formData.applicants && formData.applicants.length > 2 && formData.applicants[2] && hasApplicant3Data(formData.applicants[2])) {
      const html = renderApplicantFormHTML(formData.applicants[2], 3, formData);
      const pdf = await generatePDFFromHTML(html);
      htmlPages.push(pdf);
    }

    // Page 8 - Apartment Declaration
    const html = renderApartmentFormHTML(formData);
    const pdf = await generatePDFFromHTML(html);
    htmlPages.push(pdf);

    // Generate signature footer overlay if signatures exist
    let signatureOverlayPdf: Uint8Array | null = null;
    const hasAnySignature = formData.applicants?.some((applicant: ApplicantData) => applicant?.signature);
    if (hasAnySignature) {
      const signatureOverlayHTML = renderSignatureFooterOverlayHTML(formData);
      if (signatureOverlayHTML) {
        signatureOverlayPdf = await generatePDFFromHTML(signatureOverlayHTML);
      }
    }

    await browser.close();
    browser = null;

    // Create a new PDF document to merge pages
    const mergedPdf = await PDFDocument.create();
    const signatureOverlayDoc = signatureOverlayPdf ? await PDFDocument.load(signatureOverlayPdf) : null;

    // Copy pages 1-4 from original PDF and overlay signatures if available
    // Page numbers to skip signatures: 1, 2, 18, 19, 20, 26
    const pagesToSkipSignatures = new Set([1, 2, 18, 19, 20, 26]);
    
    for (let i = 0; i < 4 && i < pages.length; i++) {
      const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [i]);
      const newPage = mergedPdf.addPage(copiedPage);
      
      // Calculate page number (1-indexed): i + 1
      const pageNumber = i + 1;
      
      // Overlay signature footer if available and page is not in skip list
      if (signatureOverlayDoc && !pagesToSkipSignatures.has(pageNumber)) {
        const [overlayPage] = await mergedPdf.copyPages(signatureOverlayDoc, [0]);
        // Draw overlay on the new page
        const overlayForm = await mergedPdf.embedPage(overlayPage);
        newPage.drawPage(overlayForm);
      }
    }

    // Add HTML-generated pages (5-8)
    for (const htmlPdfBytes of htmlPages) {
      const htmlPdf = await PDFDocument.load(htmlPdfBytes);
      const htmlPageCount = htmlPdf.getPageCount();
      const pageIndices = Array.from({ length: htmlPageCount }, (_, i) => i);
      const copiedPages = await mergedPdf.copyPages(htmlPdf, pageIndices);
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Copy pages 9+ from original PDF and overlay signatures if available
    for (let i = 8; i < pages.length; i++) {
      const [copiedPage] = await mergedPdf.copyPages(pdfDoc, [i]);
      const newPage = mergedPdf.addPage(copiedPage);
      
      // Calculate page number (1-indexed): i + 1
      const pageNumber = i + 1;
      
      // Overlay signature footer if available and page is not in skip list
      if (signatureOverlayDoc && !pagesToSkipSignatures.has(pageNumber)) {
        const [overlayPage] = await mergedPdf.copyPages(signatureOverlayDoc, [0]);
        // Draw overlay on the new page
        const overlayForm = await mergedPdf.embedPage(overlayPage);
        newPage.drawPage(overlayForm);
      }
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
