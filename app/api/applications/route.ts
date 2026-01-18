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
        _id: 1,
        applicationId: 1, // Include readable application ID
        formData: 1, // Include formData to extract applicant name
        applicantCount: 1,
        bhkType: 1,
        createdAt: 1,
        updatedAt: 1,
        // Exclude pdfBuffer, pdfPath, pdfUrl (large fields not needed for list)
      })
      .sort({ createdAt: -1 }) // Descending order
      .lean(); // Return plain JavaScript objects

    // Map _id to id for frontend consistency and extract first applicant name
    const mappedApplications = applications.map((app: any) => {
      let firstApplicantName = 'N/A';
      
      try {
        if (app.formData) {
          const formData = typeof app.formData === 'string' 
            ? JSON.parse(app.formData) 
            : app.formData;
          
          if (formData.applicants && Array.isArray(formData.applicants) && formData.applicants.length > 0) {
            const firstApplicant = formData.applicants[0];
            firstApplicantName = firstApplicant.name || 'N/A';
          }
        }
      } catch (error) {
        console.error('Error parsing formData for application:', app._id, error);
      }

      return {
        id: app.applicationId || app._id.toString(), // Use readable ID if available
        applicationId: app.applicationId, // Include applicationId field
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        applicantCount: app.applicantCount,
        bhkType: app.bhkType,
        firstApplicantName: firstApplicantName,
      };
    });

    return NextResponse.json(mappedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}