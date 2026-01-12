'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function TestHTMLRendererContent() {
  const searchParams = useSearchParams();
  const pageType = searchParams.get('type') || 'applicant';
  const applicantNumber = parseInt(searchParams.get('applicantNumber') || '1');
  const applicationId = searchParams.get('id');

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setError('Please provide an application ID in the URL: /test-html-renderer?id=APPLICATION_ID&type=applicant&applicantNumber=1');
      setLoading(false);
      return;
    }

    // Fetch form data and render HTML
    fetch(`/api/applications/${applicationId}/form-data`)
      .then(res => res.json())
      .then(data => {
        // Import and use the renderer functions
        fetch('/api/test-render-html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: pageType,
            applicantNumber,
            formData: data.formData,
            applicant: data.formData.applicants[applicantNumber - 1],
          }),
        })
          .then(res => res.text())
          .then(html => {
            setHtmlContent(html);
            setLoading(false);
          })
          .catch(err => {
            setError(`Error rendering HTML: ${err.message}`);
            setLoading(false);
          });
      })
      .catch(err => {
        setError(`Error fetching form data: ${err.message}`);
        setLoading(false);
      });
  }, [applicationId, pageType, applicantNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HTML...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Usage: /test-html-renderer?id=APPLICATION_ID&type=applicant&applicantNumber=1
          </p>
          <p className="text-sm text-gray-500">
            Or: /test-html-renderer?id=APPLICATION_ID&type=apartment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title="HTML Renderer Preview"
      />
    </div>
  );
}

export default function TestHTMLRendererPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TestHTMLRendererContent />
    </Suspense>
  );
}
