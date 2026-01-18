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

    // Map _id to id for frontend consistency and extract applicant name
    // Priority: First applicant name -> First applicant m/s name -> Third applicant name -> Third applicant m/s name
    const mappedApplications = applications.map((app: any) => {
      let displayName = 'N/A';
      
      try {
        if (app.formData) {
          const formData = typeof app.formData === 'string' 
            ? JSON.parse(app.formData) 
            : app.formData;
          
          if (formData.applicants && Array.isArray(formData.applicants) && formData.applicants.length > 0) {
            // Check first applicant (index 0)
            const firstApplicant = formData.applicants[0];
            if (firstApplicant) {
              // If first applicant has name, use it
              if (firstApplicant.name && firstApplicant.name.trim() !== '') {
                displayName = firstApplicant.name.trim();
              }
              // If no name but has m/s name (companyName), use it
              else if (firstApplicant.companyName && firstApplicant.companyName.trim() !== '') {
                displayName = firstApplicant.companyName.trim();
              }
            }
            
            // If first applicant has no name and no m/s name, check third applicant (index 2)
            if (displayName === 'N/A' && formData.applicants.length > 2) {
              const thirdApplicant = formData.applicants[2];
              if (thirdApplicant) {
                // If third applicant has name, use it
                if (thirdApplicant.name && thirdApplicant.name.trim() !== '') {
                  displayName = thirdApplicant.name.trim();
                }
                // If no name but has m/s firm name (companyName), use it
                else if (thirdApplicant.companyName && thirdApplicant.companyName.trim() !== '') {
                  displayName = thirdApplicant.companyName.trim();
                }
              }
            }
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
        firstApplicantName: displayName,
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