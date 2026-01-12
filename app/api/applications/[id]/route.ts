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

    // Try pdfUrl first (preferred method - uses cloud storage, no size limit)
    if (application.pdfUrl) {
      try {
        const response = await fetch(application.pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF from storage: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        pdfBytes = Buffer.from(arrayBuffer);
      } catch (error) {
        console.error('Error fetching PDF from cloud storage:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve PDF from storage' },
          { status: 500 }
        );
      }
    }
    // Fallback to pdfBuffer (legacy support for old records)
    else if (application.pdfBuffer) {
      pdfBytes = Buffer.from(application.pdfBuffer, 'base64');
    } 
    // Fallback to filesystem (for local development or legacy data)
    else if (application.pdfPath) {
      try {
        const pdfFilePath = path.join(process.cwd(), 'public', application.pdfPath);
        if (fs.existsSync(pdfFilePath)) {
          pdfBytes = fs.readFileSync(pdfFilePath);
        } else {
          return NextResponse.json(
            { error: 'PDF file not found on server' },
            { status: 404 }
          );
        }
      } catch (error) {
        // If filesystem read fails (e.g., on Vercel), return error
        console.error('Error reading PDF from filesystem:', error);
        return NextResponse.json(
          { error: 'PDF not accessible. Filesystem storage not available on this server.' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'PDF not found for this application' },
        { status: 404 }
      );
    }

    return new NextResponse(pdfBytes as unknown as BodyInit, {
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