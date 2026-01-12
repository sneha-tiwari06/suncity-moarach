import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const applications = await Application.find({})
      .select({
        formData: 0, // Exclude large form data from list
        pdfBuffer: 0, // Exclude large PDF from list
      })
      .sort({ createdAt: -1 }) // Descending order
      .lean(); // Return plain JavaScript objects

    // Map _id to id for frontend consistency
    const mappedApplications = applications.map((app: any) => ({
      id: app._id.toString(),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      applicantCount: app.applicantCount,
      bhkType: app.bhkType,
    }));

    return NextResponse.json(mappedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}