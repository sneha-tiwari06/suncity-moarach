'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch the PDF with HTML (same as admin uses)
  useEffect(() => {
    if (applicationId) {
      // Use the same endpoint as admin dashboard
      const pdfUrl = `/api/applications/${applicationId}/pdf-with-html`;
      setPdfUrl(pdfUrl);
          setLoading(false);
    }
  }, [applicationId]);

  const handleDownload = () => {
    // Download the PDF with HTML
    fetch(`/api/applications/${applicationId}/pdf-with-html`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to download PDF');
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `application-${applicationId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Error downloading PDF:', err);
        alert('Failed to download PDF. Please try again.');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back to Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-6 print:shadow-none print:rounded-none print:p-0 print:max-w-none">
        {/* Header - Hidden on Print */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Application Submitted Successfully
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Application ID: {applicationId}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>

        {/* PDF Viewer - Same as admin preview */}
        {pdfUrl && (
          <div className="w-full" style={{ minHeight: '800px' }}>
            <iframe
              src={pdfUrl}
              className="w-full border-0"
              style={{ minHeight: '800px', height: '100vh' }}
              title="Application Preview"
                      />
                    </div>
        )}
      </div>
    </div>
  );
}
