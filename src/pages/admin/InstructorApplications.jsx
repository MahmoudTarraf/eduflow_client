import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Eye, Download, Video, 
  FileText, Mail, Phone, Globe, Award 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';
import VideoPlayer from '../../components/common/VideoPlayer';

const InstructorApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/instructor-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/instructor-applications/${selectedApp._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Application approved! Instructor account created.');
      setShowApproveConfirm(false);
      setSelectedApp(null);
      setShowDetails(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error(error.response?.data?.message || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/instructor-applications/${selectedApp._id}/reject`, {
        reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Application rejected.');
      setShowRejectConfirm(false);
      setSelectedApp(null);
      setShowDetails(false);
      setRejectionReason('');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const openDetails = async (app) => {
    setSelectedApp(app);
    setShowDetails(true);
    
    console.log('[InstructorApp] Opening details for:', app);
    console.log('[InstructorApp] userId:', app.userId);
    console.log('[InstructorApp] introVideoUrl:', app.introVideoUrl);
    
    // Fetch video info from new agreement system
    if (app.userId) {
      try {
        setLoadingVideo(true);
        console.log('[InstructorApp] Fetching video info for userId:', app.userId);
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/instructor/${app.userId}/video-info`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        console.log('[InstructorApp] Video info response:', response.data);
        if (response.data.success) {
          setVideoInfo(response.data.data);
          console.log('[InstructorApp] Video info set:', response.data.data);
        }
      } catch (error) {
        console.error('[InstructorApp] Error fetching video:', error);
        console.log('[InstructorApp] No video found for this instructor');
        setVideoInfo(null);
      } finally {
        setLoadingVideo(false);
      }
    } else {
      console.log('[InstructorApp] No userId found, skipping video fetch');
      setVideoInfo(null);
      setLoadingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Instructor Applications
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and manage pending instructor applications
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Pending Applications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no instructor applications to review at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applications.map((app) => (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      {app.profilePhoto ? (
                        <img
                          src={app.profilePhoto}
                          alt={app.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          {app.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {app.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {app.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {app.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Areas of Expertise:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {app.expertise.map((area, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                      {app.emailVerified && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Email Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openDetails(app)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setShowApproveConfirm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setShowRejectConfirm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Application Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApp.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApp.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApp.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Country</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApp.country}</p>
                    </div>
                  </div>
                </div>

                {/* Agreement */}
                {selectedApp.agreementPdfUrl && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Signed Agreement
                    </h3>
                    <PDFDownloadButton pdfUrl={selectedApp.agreementPdfUrl} />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Signed: {new Date(selectedApp.agreementSignedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Video */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Introduction Video
                  </h3>
                  {(() => {
                    console.log('[Video Render] loadingVideo:', loadingVideo);
                    console.log('[Video Render] videoInfo:', videoInfo);
                    console.log('[Video Render] selectedApp.introVideoUrl:', selectedApp.introVideoUrl);
                    console.log('[Video Render] selectedApp.userId:', selectedApp.userId);
                    
                    if (loadingVideo) {
                      console.log('[Video Render] Showing loading spinner');
                      return (
                        <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      );
                    }
                    
                    if (videoInfo?.hasVideo) {
                      console.log('[Video Render] Showing videoInfo video:', videoInfo.videoUrl);
                      const isYouTube =
                        videoInfo?.storageType === 'youtube' ||
                        !!videoInfo?.youtubeVideoId ||
                        (typeof videoInfo?.videoUrl === 'string' && (videoInfo.videoUrl.includes('youtube.com') || videoInfo.videoUrl.includes('youtu.be')));

                      if (isYouTube) {
                        return (
                          <CustomYouTubePlayer
                            youtubeVideoId={videoInfo?.youtubeVideoId || null}
                            embedUrl={videoInfo?.youtubeUrl || videoInfo?.videoUrl || ''}
                            title="Instructor Introduction Video"
                          />
                        );
                      }

                      return <VideoPlayer videoUrl={videoInfo.videoUrl} />;
                    }
                    
                    if (selectedApp.introVideoUrl) {
                      console.log('[Video Render] Showing old format video:', selectedApp.introVideoUrl);
                      return <VideoPlayer videoUrl={selectedApp.introVideoUrl} isOldFormat={true} />;
                    }
                    
                    console.log('[Video Render] No video available');
                    return (
                      <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">No video available</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Approve Confirmation */}
        <ConfirmDialog
          isOpen={showApproveConfirm}
          onClose={() => {
            setShowApproveConfirm(false);
            setSelectedApp(null);
          }}
          onConfirm={handleApprove}
          title="Approve Instructor"
          message={`Are you sure you want to approve ${selectedApp?.name}'s application? This will create their instructor account and send them a welcome email.`}
          confirmText="Approve"
          confirmButtonClass="bg-green-600 hover:bg-green-700 text-white"
          loading={processing}
          icon={
            <CheckCircle className="w-12 h-12 text-green-500" />
          }
        />

        {/* Reject Confirmation */}
        <ConfirmDialog
          isOpen={showRejectConfirm}
          onClose={() => {
            setShowRejectConfirm(false);
            setSelectedApp(null);
            setRejectionReason('');
          }}
          onConfirm={handleReject}
          title="Reject Application"
          message={
            <div>
              <p className="mb-4">Are you sure you want to reject {selectedApp?.name}'s application?</p>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (required) *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Provide a reason for rejection..."
                required
              />
            </div>
          }
          confirmText="Reject"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          loading={processing}
        />
      </div>
    </div>
  );
};

// PDF Download Button Component - handles local and Cloudinary PDFs
const PDFDownloadButton = ({ pdfUrl }) => {
  const handleDownload = async () => {
    try {
      // Check if it's a Cloudinary URL
      if (pdfUrl.includes('cloudinary.com')) {
        // Cloudinary URL - open in new tab or download directly
        window.open(pdfUrl, '_blank');
      } else {
        // Local PDF - download with proper baseURL
        const fullUrl = pdfUrl.startsWith('http') 
          ? pdfUrl 
          : `${axios.defaults.baseURL || 'http://localhost:5000'}${pdfUrl}`;
        
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = 'instructor-agreement.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
    >
      <Download className="w-4 h-4" />
      Download Agreement PDF
    </button>
  );
};

export default InstructorApplications;
