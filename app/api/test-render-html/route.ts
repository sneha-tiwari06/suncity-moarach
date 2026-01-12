import { NextRequest, NextResponse } from 'next/server';
import { renderApplicantFormHTML, renderApartmentFormHTML } from '@/lib/html-renderer';
import { FormData, ApplicantData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, applicantNumber, formData, applicant } = body;

    let html = '';

    if (type === 'apartment') {
      html = renderApartmentFormHTML(formData as FormData);
    } else {
      html = renderApplicantFormHTML(applicant as ApplicantData, applicantNumber, formData as FormData);
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error rendering HTML:', error);
    return new NextResponse(`<html><body><h1>Error</h1><p>${error.message}</p></body></html>`, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}
