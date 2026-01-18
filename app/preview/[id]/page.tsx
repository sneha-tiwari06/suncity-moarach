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
  const [iframeLoading, setIframeLoading] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(0);

  // Beautiful loading messages that rotate
  const loadingMessages = [
    'Preparing your application document...',
    'Generating your personalized PDF...',
    'Almost there! Loading your application...',
    'Your application is ready! Finalizing details...',
  ];

  // Rotate messages every 2 seconds
  useEffect(() => {
    if (iframeLoading) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [iframeLoading, loadingMessages.length]);

  // Fetch the PDF with HTML (same as admin uses)
  useEffect(() => {
    if (applicationId) {
      // Use the same endpoint as admin dashboard
      const pdfUrl = `/api/applications/${applicationId}/pdf-with-html`;
      setPdfUrl(pdfUrl);
      setLoading(false);
    }
  }, [applicationId]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setError('Failed to load the application preview. Please try again.');
  };

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}} />
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
        </div>

        {/* PDF Viewer - Same as admin preview */}
        {pdfUrl && (
          <div className="w-full relative" style={{ minHeight: '800px' }}>
            {/* Loading Overlay */}
            {iframeLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center px-6 py-8">
                  {/* Spinning Loader */}
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-blue-600 animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Rotating Message */}
                  <div className="min-h-[40px] flex items-center justify-center">
                    <p className="text-gray-700 text-lg font-medium animate-fade-in">
                      {loadingMessages[currentMessage]}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-center space-x-1">
                    {loadingMessages.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentMessage
                            ? 'bg-blue-600 w-6'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <iframe
              src={pdfUrl}
              className="w-full border-0"
              style={{ minHeight: '800px', height: '100vh' }}
              title="Application Preview"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        )}
        </div>
      </div>
    </>
  );
}
