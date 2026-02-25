import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCloudUpload } from '../../hooks/useCloudUpload';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';

/**
 * Admin Dashboard for Managing Cloud Assets
 * Displays all Cloudinary files and videos
 */
const CloudAssetsManagement = () => {
  const [cloudinaryAssets, setCloudinaryAssets] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cloudinary'); // 'cloudinary' or 'youtube'
  const [videoPreview, setVideoPreview] = useState({ open: false, video: null });
  const [filters, setFilters] = useState({
    courseId: '',
    sectionId: '',
    uploadedBy: ''
  });

  const { deleteFile, deleteVideo } = useCloudUpload();

  const rawBase = process.env.REACT_APP_API_URL || 'https://eduflow-server-87rv.onrender.com';
  const apiBase = rawBase
    ? `${String(rawBase).replace(/\/+$/, '')}${String(rawBase).replace(/\/+$/, '').endsWith('/api') ? '' : '/api'}`
    : '/api';

  useEffect(() => {
    fetchAssets();
  }, [filters]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch Cloudinary assets
      const cloudinaryRes = await axios.get(
        `${apiBase}/upload/cloudinary`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: filters
        }
      );
      setCloudinaryAssets(cloudinaryRes.data.data || []);

      // Fetch YouTube videos
      const youtubeRes = await axios.get(
        `${apiBase}/youtube/videos`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: filters
        }
      );
      setYoutubeVideos(youtubeRes.data.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      toast.error('Failed to load assets');
      setLoading(false);
    }
  };

  const handleDeleteCloudinary = async (assetId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteFile(assetId);
      toast.success('File deleted successfully');
      fetchAssets();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteYouTube = async (videoRecordId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteVideo(videoRecordId);
      toast.success('Video deleted successfully');
      fetchAssets();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CloudinaryAssetsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded At
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cloudinaryAssets.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p>No Cloudinary assets found</p>
                </div>
              </td>
            </tr>
          ) : (
            cloudinaryAssets.map((asset) => (
              <tr key={asset._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-xs">
                        {asset.format?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{asset.title}</div>
                      <div className="text-sm text-gray-500">{asset.originalFilename}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    📁 Cloudinary
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(asset.fileSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.uploadedBy?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.course?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(asset.uploadedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <a
                    href={asset.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteCloudinary(asset._id, asset.title)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const YouTubeVideosTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Video
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Privacy
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Course
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded At
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {youtubeVideos.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <svg className="h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>No hosted videos found</p>
                </div>
              </td>
            </tr>
          ) : (
            youtubeVideos.map((video) => (
              <tr key={video._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-xs">VID</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{video.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${video.privacyStatus === 'public' ? 'bg-green-100 text-green-800' :
                      video.privacyStatus === 'unlisted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {video.privacyStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(video.fileSize)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {video.uploadedBy?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {video.course?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(video.uploadedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    type="button"
                    onClick={() => setVideoPreview({ open: true, video })}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Watch
                  </button>
                  <button
                    onClick={() => handleDeleteYouTube(video._id, video.title)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cloud Assets Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage all uploaded files and hosted videos
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cloudinary Files</p>
              <p className="text-2xl font-semibold text-gray-900">{cloudinaryAssets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
              <span className="text-indigo-600 font-semibold text-xs">VID</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hosted Videos</p>
              <p className="text-2xl font-semibold text-gray-900">{youtubeVideos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {cloudinaryAssets.length + youtubeVideos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('cloudinary')}
              className={`${activeTab === 'cloudinary'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              📁 Cloudinary Files ({cloudinaryAssets.length})
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`${activeTab === 'youtube'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              🎥 Hosted Videos ({youtubeVideos.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'cloudinary' ? <CloudinaryAssetsTable /> : <YouTubeVideosTable />}
        </div>
      </div>

      {videoPreview.open && videoPreview.video && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setVideoPreview({ open: false, video: null })}
        >
          <div
            className="w-full max-w-5xl bg-gray-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-black/60">
              <div className="text-white text-sm font-semibold truncate pr-4">
                {videoPreview.video.title}
              </div>
              <button
                type="button"
                className="text-white/80 hover:text-white text-sm"
                onClick={() => setVideoPreview({ open: false, video: null })}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <CustomYouTubePlayer
                youtubeVideoId={videoPreview.video.youtubeVideoId}
                title={videoPreview.video.title}
                autoPlay={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudAssetsManagement;
