import { NextRequest, NextResponse } from 'next/server';
import { generateFilledPDF } from '@/lib/pdf-generator';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, applicantCount, bhkType } = body;

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

    // Save to database
    const application = await Application.create({
      formData: JSON.stringify(formData),
      pdfBuffer: Buffer.from(pdfBytes).toString('base64'),
      applicantCount,
      bhkType,
    });

    // Return the PDF as response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="filled-application-${application._id.toString()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
