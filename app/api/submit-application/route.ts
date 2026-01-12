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
    if (!formData || !applicantCount || !bhkType) {
      return NextResponse.json(
        { error: 'Missing required fields: formData, applicantCount, or bhkType' },
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

    // Connect to MongoDB
    await connectDB();

    // Generate the filled PDF
    const pdfBytes = await generateFilledPDF(
      new Uint8Array(originalPdfBytes),
      formData,
      applicantCount,
      bhkType,
      getImageForBHK
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
      formData: JSON.stringify(formData),
      pdfUrl: blob.url, // Store URL to PDF in cloud storage
      applicantCount,
      bhkType,
    });

    // Return JSON with application ID (not the PDF)
    return NextResponse.json({
      success: true,
      applicationId: application._id.toString(),
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
