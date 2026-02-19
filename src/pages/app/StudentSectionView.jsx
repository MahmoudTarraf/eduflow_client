import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Video, FileText, Rocket, Download, Check, Lock, Play, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import VideoPlayer from '../../components/common/VideoPlayer';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';

const StudentSectionView = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [section, setSection] = useState(null);
  const [content, setContent] = useState([]);
  const [progress, setProgress] = useState({});
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const fetchSectionData = useCallback(async () => {
    try {
      // Block suspended students with accessCoursePages or continueCourses restrictions
      if (
        user?.role === 'student' &&
        user?.status === 'suspended' &&
        (user?.restrictions?.accessCoursePages || user?.restrictions?.continueCourses)
      ) {
        toast.error('Your account is suspended. You cannot access this section or continue courses.');
        navigate('/student');
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check access
      const accessRes = await axios.get(`/api/sections/${sectionId}/access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasAccess(accessRes.data.hasAccess);
      setAccessReason(accessRes.data.reason);
      
      if (!accessRes.data.hasAccess) {
        setLoading(false);
        return;
      }
      
      // Fetch section
      const sectionRes = await axios.get(`/api/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSection(sectionRes.data.data);
      
      // Fetch content
      const contentRes = await axios.get(`/api/sections/${sectionId}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent(contentRes.data.data || []);
      
      // Fetch progress
      const progressRes = await axios.get(`/api/progress/student/${user._id}/section/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const progressMap = {};
      (progressRes.data.data?.progress || []).forEach(p => {
        progressMap[p.item._id || p.item] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error fetching section data:', error);
      toast.error(error.response?.data?.message || 'Failed to load section');
    } finally {
      setLoading(false);
    }
  }, [sectionId, user, navigate]);

  useEffect(() => {
    fetchSectionData();
  }, [fetchSectionData]);

  useEffect(() => {
    // VideoPlayer component handles its own progress tracking
    // No need for additional interval here
  }, [selectedContent, showVideoModal]);

  const markAsCompleted = async (contentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/progress/markCompleted', {
        itemId: contentId,
        sectionId: section._id,
        groupId: section.group,
        courseId: section.course
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProgress(prev => ({
        ...prev,
        [contentId]: response.data.data
      }));
      
      toast.success('Marked as completed!');
    } catch (error) {
      console.error('Error marking complete:', error);
      toast.error('Failed to mark as completed');
    }
  };

  const openVideoModal = (item) => {
    setSelectedContent(item);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedContent(null);
    // Refresh progress after video ends
    fetchSectionData();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
        <div className="max-w-2xl mx-auto px-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 text-center`}>
            <Lock className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Access Denied
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {accessReason === 'payment_required' && 'This section requires payment to access.'}
              {accessReason === 'payment_pending' && 'Your payment is pending verification by the instructor.'}
              {accessReason === 'not_enrolled' && 'You need to enroll in this course first.'}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lectures = content.filter(c => c.type === 'lecture');
  const assignments = content.filter(c => c.type === 'assignment');
  const projects = content.filter(c => c.type === 'project');
  
  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const totalCount = content.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`mb-4 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} flex items-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {section?.name}
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {section?.description || 'Section content'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Your Progress
              </span>
              <span className={`text-sm font-bold ${
                progressPercentage === 100 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}>
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  progressPercentage === 100 ? 'bg-green-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {completedCount} of {totalCount} items completed
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Lectures */}
          {lectures.length > 0 && (
            <div>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                📹 Lectures ({lectures.length})
              </h2>
              <div className="space-y-3">
                {lectures.map((item) => (
                  <ContentItem
                    key={item._id}
                    item={item}
                    progress={progress[item._id]}
                    theme={theme}
                    onWatch={openVideoModal}
                    onMarkComplete={markAsCompleted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assignments */}
          {assignments.length > 0 && (
            <div>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                📝 Assignments ({assignments.length})
              </h2>
              <div className="space-y-3">
                {assignments.map((item) => (
                  <ContentItem
                    key={item._id}
                    item={item}
                    progress={progress[item._id]}
                    theme={theme}
                    onMarkComplete={markAsCompleted}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                🚀 Projects ({projects.length})
              </h2>
              <div className="space-y-3">
                {projects.map((item) => (
                  <ContentItem
                    key={item._id}
                    item={item}
                    progress={progress[item._id]}
                    theme={theme}
                    onWatch={openVideoModal}
                    onMarkComplete={markAsCompleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Modal */}
        {showVideoModal && selectedContent && (
          selectedContent.video?.storageType === 'youtube' ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={closeVideoModal}>
              <div className="relative w-full max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={closeVideoModal}
                  className="absolute -top-10 right-0 p-2 hover:bg-white/20 rounded-lg transition text-white"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <CustomYouTubePlayer
                  youtubeVideoId={selectedContent.video?.youtubeVideoId}
                  title={selectedContent.title}
                  autoPlay={false}
                  contentId={selectedContent._id}
                  onComplete={() => {
                    fetchSectionData();
                  }}
                />
              </div>
            </div>
          ) : (
            <VideoPlayer
              videoUrl={`/api/content/${selectedContent._id}/stream`}
              onClose={closeVideoModal}
              title={selectedContent.title}
              contentId={selectedContent._id}
              onComplete={() => {
                // Refresh content to show updated progress
                fetchSectionData();
              }}
            />
          )
        )}
      </div>
    </div>
  );
};

// Content Item Component
const ContentItem = ({ item, progress, theme, onWatch, onMarkComplete }) => {
  const isCompleted = progress?.completed || false;
  const canWatch = (
    item.type === 'lecture' ||
    item.type === 'project'
  ) && (
    item.video?.storageType === 'youtube' ||
    item.videoPath ||
    item.video?.path
  );

  const getIcon = () => {
    switch (item.type) {
      case 'lecture':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'assignment':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'project':
        return <Rocket className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 flex items-start justify-between`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {getIcon()}
          <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {item.title}
          </h4>
          {isCompleted && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <Check className="w-3 h-3 mr-1" />
              Completed
            </span>
          )}
        </div>

        {item.description && (
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            {item.description}
          </p>
        )}

        {item.dueDate && (
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex gap-2 ml-4">
        {canWatch && onWatch && (
          <button
            onClick={() => onWatch(item)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            <Play className="w-4 h-4 mr-1" />
            Watch
          </button>
        )}

        {(item.filePath || item.file?.path) && (
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/content/${item._id}/download${item.type === 'project' ? '?type=starter' : ''}`, {
                  headers: { Authorization: `Bearer ${token}` },
                  responseType: 'blob'
                });
                
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', item.fileName || item.file?.originalName || `${item.title}.rar`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success('File downloaded successfully');
              } catch (error) {
                console.error('Download error:', error);
                toast.error(error.response?.data?.message || 'Failed to download file');
              }
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </button>
        )}

        {!isCompleted && (
          <button
            onClick={() => onMarkComplete(item._id)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
          >
            <Check className="w-4 h-4 mr-1" />
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentSectionView;
