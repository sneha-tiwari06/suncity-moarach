import { NextRequest, NextResponse } from 'next/server';
import { generateFilledPDF } from '@/lib/pdf-generator';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import path from 'path';
import fs from 'fs';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, applicantCount, bhkType } = body;

    // Validate required data
    if (!formData || !applicantCount) {
      return NextResponse.json(
        { error: 'Missing required fields: formData or applicantCount' },
        { status: 400 }
      );
    }

    // Path to the original PDF
    const pdfPath = path.join(process.cwd(), 'public', 'form.pdf');
    
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'Original PDF not found. Please ensure form.pdf exists in the public folder.' },
        { status: 404 }
      );
    }

    // Read the original PDF
    const originalPdfBytes = fs.readFileSync(pdfPath);

    // Connect to MongoDB
    await connectDB();

    // Generate sequential application ID
    const generateApplicationId = async (): Promise<string> => {
      // Find all applications with applicationId and get the highest number
      const applications = await Application.find(
        { applicationId: { $exists: true, $ne: null } },
        { applicationId: 1 }
      )
        .sort({ createdAt: -1 })
        .lean();

      let maxNumber = 0;

      // Find the highest number from existing applicationIds
      applications.forEach((app) => {
        if (app.applicationId) {
          const match = app.applicationId.match(/SUNMON-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });

      // Increment by 1
      const nextNumber = maxNumber + 1;

      // Format as SUNMON-XXXXXX (6 digits)
      const formattedNumber = nextNumber.toString().padStart(6, '0');
      return `SUNMON-${formattedNumber}`;
    };

    const applicationId = await generateApplicationId();

    // Generate the filled PDF
    const pdfBytes = await generateFilledPDF(
      new Uint8Array(originalPdfBytes),
      formData,
      applicantCount,
      bhkType
    );

    // Upload PDF to Vercel Blob Storage to avoid MongoDB 16MB document limit
    const pdfBuffer = Buffer.from(pdfBytes);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const blobName = `applications/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
    
    const blob = await put(blobName, pdfBlob, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Save to database with pdfUrl (no size limit)
    const application = await Application.create({
      applicationId,
      formData: JSON.stringify(formData),
      pdfUrl: blob.url, // Store URL to PDF in cloud storage
      applicantCount,
      bhkType,
    });

    // Ensure applicationId is saved - refresh from database if needed
    const savedApplication = await Application.findById(application._id);
    const finalApplicationId = savedApplication?.applicationId || application.applicationId || application._id.toString();

    // Log for debugging
    console.log('Generated Application ID:', applicationId);
    console.log('Saved Application ID:', savedApplication?.applicationId);
    console.log('Final Application ID returned:', finalApplicationId);

    // Return JSON with application ID (not the PDF)
    return NextResponse.json({
      success: true,
      applicationId: finalApplicationId,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit application', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
