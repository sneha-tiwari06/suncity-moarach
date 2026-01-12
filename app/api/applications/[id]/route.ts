import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const application = await Application.findById(id);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    let pdfBytes: Buffer;

    // Try to read from filesystem first (new method - avoids 16MB limit)
    if (application.pdfPath) {
      const pdfFilePath = path.join(process.cwd(), 'public', application.pdfPath);
      if (fs.existsSync(pdfFilePath)) {
        pdfBytes = fs.readFileSync(pdfFilePath);
      } else {
        return NextResponse.json(
          { error: 'PDF file not found on server' },
          { status: 404 }
        );
      }
    } 
    // Fallback to pdfBuffer (old method - for backward compatibility)
    else if (application.pdfBuffer) {
      pdfBytes = Buffer.from(application.pdfBuffer, 'base64');
    } else {
      return NextResponse.json(
        { error: 'PDF not found for this application' },
        { status: 404 }
      );
    }

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="application-${application._id.toString()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}