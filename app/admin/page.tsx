'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import '@/lib/pdfjs-worker'; // Configure PDF.js worker

interface Application {
  id: string;
  createdAt: string;
  updatedAt: string;
  applicantCount: number;
  bhkType: string | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
      } else {
        router.push('/login?redirect=/admin');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login?redirect=/admin');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (id: string) => {
    setSelectedApplication(id);
    try {
      const response = await fetch(`/api/applications/${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setPageNumber(1);
      } else {
        alert('Failed to load PDF');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `application-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')?.print();
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Not authenticated. Redirecting...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome, <span className="font-semibold">{user.username}</span> ({user.email})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Submitted Applications</h2>
            
            {applications.length === 0 ? (
              <p className="text-gray-500">No applications submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">ID: {app.id.slice(0, 8)}...</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Submitted: {new Date(app.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Applicants: {app.applicantCount} | BHK: {app.bhkType || 'N/A'}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleViewApplication(app.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(app.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF Viewer */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">PDF Viewer</h2>
            
            {!pdfUrl ? (
              <div className="flex items-center justify-center h-96 text-gray-500">
                Select an application to view PDF
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      disabled={pageNumber <= 1}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {pageNumber} of {numPages}
                    </span>
                    <button
                      onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                      disabled={pageNumber >= numPages}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
                    >
                      Next
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Print (Ctrl+P)
                  </button>
                </div>
                
                <div className="border border-gray-300 rounded overflow-auto max-h-[600px] flex justify-center">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="p-8">Loading PDF...</div>}
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={612}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-lg"
                    />
                  </Document>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}