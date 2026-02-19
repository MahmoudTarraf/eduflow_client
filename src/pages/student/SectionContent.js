import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';
import { fireGamificationEvents } from '../../utils/gamificationUtils';
const EmbeddedVideoPlayer = lazy(() => import('../../components/common/EmbeddedVideoPlayer'));
const SecureYouTubePlayer = lazy(() => import('../../components/common/SecureYouTubePlayer'));

const StudentSectionContent = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [section, setSection] = useState(null);
  const [content, setContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState({});
  const [tests, setTests] = useState([]);
  const [testAttempts, setTestAttempts] = useState({});
  const [loadingTests, setLoadingTests] = useState(false);
  const [downloadingContentId, setDownloadingContentId] = useState(null);
  const targetLectureId = searchParams.get('lecture');
  const secureUrlCacheRef = useRef({});
  const [secureUrl, setSecureUrl] = useState('');

  const handleDownloadContentFile = async (contentId, contentTitle, { type } = {}) => {
    try {
      setDownloadingContentId(contentId);
      const token = localStorage.getItem('token');

      const url = type ? `/api/content/${contentId}/download?type=${encodeURIComponent(type)}` : `/api/content/${contentId}/download`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        validateStatus: (status) => status < 500
      });

      if (response.status === 204 || (response.status === 200 && response.data.size === 0)) {
        return;
      }

      if (response.status >= 400) {
        throw new Error('Download failed');
      }

      if (response.data.type && response.data.type.includes('json')) {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Download failed');
        } catch (e) {
          throw new Error('Download failed');
        }
      }

      const contentDisposition = response.headers['content-disposition'];
      let filename = `${contentTitle || 'file'}.rar`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/["']/g, '').trim();
        }
      }

      if (!filename.match(/\.(rar|zip)$/i)) {
        filename += '.rar';
      }

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('[StudentSectionContent] Error downloading file:', error);
      alert('Failed to download file. Please try again later.');
    } finally {
      setTimeout(() => {
        setDownloadingContentId((prev) => (prev === contentId ? null : prev));
      }, 1200);
    }
  };

  useEffect(() => {
    fetchSectionAndContent();
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  useEffect(() => {
    let canceled = false;

    const loadSecureUrl = async () => {
      try {
        if (!selectedContent || selectedContent.video?.storageType !== 'youtube') {
          setSecureUrl('');
          return;
        }

        const contentId = selectedContent._id;
        const cached = secureUrlCacheRef.current[contentId];
        if (cached) {
          setSecureUrl(cached);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await axios.post(
          `/api/secure/video/${contentId}/session`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const url = res?.data?.secureUrl;
        if (!url) {
          setSecureUrl('');
          return;
        }

        secureUrlCacheRef.current[contentId] = url;
        if (!canceled) {
          setSecureUrl(url);
        }
      } catch (error) {
        console.error('Error creating secure playback session:', error);
        if (!canceled) {
          setSecureUrl('');
        }
      }
    };

    loadSecureUrl();
    return () => {
      canceled = true;
    };
  }, [selectedContent?._id, selectedContent?.video?.storageType]);

  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/active-tests/section/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const testsData = response.data.tests || [];
      setTests(testsData);
      
      // Fetch attempts for each test
      for (const test of testsData) {
        fetchTestAttempts(test._id);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchTestAttempts = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/active-tests/${testId}/attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const attempts = res.data.attempts || [];
      setTestAttempts(prev => ({
        ...prev,
        [testId]: attempts
      }));
    } catch (error) {
      console.error('Error fetching test attempts:', error);
      setTestAttempts(prev => ({
        ...prev,
        [testId]: []
      }));
    }
  };

  const fetchSectionAndContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check section access first
      const accessRes = await axios.get(
        `/api/sections/${sectionId}/access`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!accessRes.data.hasAccess) {
        // Redirect to payment page if section is not accessible
        if (accessRes.data.reason === 'payment_required' || accessRes.data.reason === 'payment_pending') {
          navigate(`/student/section/${sectionId}/payment`);
          return;
        }
      }
      
      const sectionRes = await axios.get(
        `/api/sections/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSection(sectionRes.data.data);

      const contentRes = await axios.get(
        `/api/content/section/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const contentData = contentRes.data.data || [];
      setContent(contentData);

      // Build progress map
      const progressMap = {};
      contentData.forEach(item => {
        if (item.progress) {
          progressMap[item._id] = item.progress;
        }
      });
      setProgressData(progressMap);

      // Auto-select target lecture if specified, or first content if available
      let contentToSelect = contentData[0];
      if (targetLectureId) {
        const targetContent = contentData.find(item => item._id === targetLectureId);
        if (targetContent) {
          contentToSelect = targetContent;
        }
      }

      setSelectedContent(contentToSelect);

      // Note: Don't auto-open video player here to prevent issues
      // User will click the play button to open the video player
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (contentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/content/${contentId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fire gamification celebrations if present
      console.log('📚 SectionContent: Content completion response:', response?.data);
      try {
        if (response?.data?.gamification) {
          console.log('📚 SectionContent: Firing gamification events for content completion');
          fireGamificationEvents(response.data.gamification);
        } else {
          // Fire specific toast based on content type even if no server gamification data
          const contentItem = content.find(item => item._id === contentId);
          const contentType = contentItem?.type || 'lesson';
          
          let eventType, message;
          switch (contentType) {
            case 'lecture':
              eventType = 'lessonCompleted';
              message = '📚 Lecture completed! Keep learning!';
              break;
            case 'assignment':
              eventType = 'assignmentSubmitted';
              message = '📝 Assignment completed! Well done!';
              break;
            case 'project':
              eventType = 'projectSubmitted';
              message = '🚀 Project completed! Great work!';
              break;
            default:
              eventType = 'lessonCompleted';
              message = '📚 Lesson completed! Keep going!';
          }
          
          console.log('📚 SectionContent: Firing specific content completion toast', eventType);
          const { showGamificationToast } = await import('../../components/common/ToastManager');
          showGamificationToast(eventType, message);
        }
      } catch (error) {
        console.error('📚 SectionContent: Error firing gamification events:', error);
      }

      // Update progress data
      setProgressData(prev => ({
        ...prev,
        [contentId]: response.data.data
      }));

      // Update content list
      setContent(prev => prev.map(item => 
        item._id === contentId 
          ? { ...item, progress: response.data.data }
          : item
      ));

      // Refresh the section data to update UI
      fetchSectionAndContent();
      alert('✅ Marked as completed!');
    } catch (error) {
      console.error('Error marking as completed:', error);
      alert(error.response?.data?.message || 'Failed to mark as completed');
    }
  };

  // Video player functions removed - now using embedded player directly in content area

  const getProgressPercentage = () => {
    const total = content.length;
    if (total === 0) return 0;
    const completed = Object.values(progressData).filter(p => p.completed).length;
    return Math.round((completed / total) * 100);
  };

  const renderContentSidebar = () => {
    const groupedContent = {
      lecture: content.filter(c => c.type === 'lecture'),
      assignment: content.filter(c => c.type === 'assignment'),
      project: content.filter(c => c.type === 'project')
    };

    const typeIcons = {
      lecture: '🎥',
      assignment: '📝',
      project: '🚀'
    };

    const typeLabels = {
      lecture: 'Lectures',
      assignment: 'Assignments',
      project: 'Projects'
    };

    return (
      <div className="space-y-4">
        {Object.entries(groupedContent).map(([type, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={type}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">{typeIcons[type]}</span>
                {typeLabels[type]} ({items.length})
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const progress = progressData[item._id];
                  const isCompleted = progress?.completed;
                  const isSelected = selectedContent?._id === item._id;

                  return (
                    <button
                      key={item._id}
                      onClick={async () => {
                        setSelectedContent(item);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                        {isCompleted && (
                          <span className="ml-2 text-green-500">
                            {isSelected ? '✅' : '✓'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Active Tests Section */}
        {tests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📝</span>
              Active Tests ({tests.length})
            </h3>
            <div className="space-y-2">
              {tests.map((test) => {
                const attempts = testAttempts[test._id] || [];
                const gradedAttempts = attempts.filter(a => a.status === 'graded');
                const bestAttempt = gradedAttempts.length > 0 
                  ? gradedAttempts.reduce((best, current) => 
                      (current.score || 0) > (best.score || 0) ? current : best
                    , gradedAttempts[0])
                  : null;
                
                return (
                  <div
                    key={test._id}
                    className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{test.title}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{test.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center">
                            ⏱️ {test.timeLimitMinutes} min
                          </span>
                          <span className="flex items-center">
                            📊 {test.questions?.length || 0} Q's
                          </span>
                          <span className="flex items-center">
                            🎯 {test.passingScore}% pass
                          </span>
                        </div>
                        {bestAttempt && (
                          <div className={`mt-2 text-xs font-semibold ${bestAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                            ✓ Completed - Score: {bestAttempt.score}%
                          </div>
                        )}
                        {!bestAttempt && (
                          <div className="mt-2 text-xs text-gray-400">
                            Not Complete - 0%
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (bestAttempt) {
                          navigate(`/student/test-results/${bestAttempt._id}`);
                        } else {
                          navigate(`/student/test/${test._id}`);
                        }
                      }}
                      className={`w-full mt-3 px-4 py-2 text-white text-sm rounded-md transition font-medium ${
                        bestAttempt 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {bestAttempt ? 'View Results' : 'Start Test'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loadingTests && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading tests...</p>
          </div>
        )}
      </div>
    );
  };

  const renderContentViewer = () => {
    if (!selectedContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select content from the sidebar to start</p>
        </div>
      );
    }

    const progress = progressData[selectedContent._id];
    const isCompleted = progress?.completed;

    return (
      <div className="h-full flex flex-col">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{selectedContent.title}</h2>
              {selectedContent.description && (
                <p className="mt-2 text-gray-600">{selectedContent.description}</p>
              )}
              <div className="mt-3 flex items-center space-x-4 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  selectedContent.type === 'lecture' ? 'bg-blue-100 text-blue-800' :
                  selectedContent.type === 'assignment' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedContent.type.toUpperCase()}
                </span>
                {selectedContent.dueDate && (
                  <span className="text-gray-500">
                    📅 Due: {new Date(selectedContent.dueDate).toLocaleDateString()}
                  </span>
                )}
                {selectedContent.maxScore && (
                  <span className="text-gray-500">
                    🎯 Max Score: {selectedContent.maxScore}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => markAsCompleted(selectedContent._id)}
              disabled={isCompleted}
              className={`px-4 py-2 rounded-md font-medium transition ${
                isCompleted
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isCompleted ? '✅ Completed' : '✓ Mark as Complete'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Lecture - Video Player (Multi-Source Support) */}
          {selectedContent.type === 'lecture' && (
            <div className="space-y-4">
              {/* Detect storage type and render appropriate player */}
              {selectedContent.video?.storageType === 'youtube' ? (
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}> 
                  {secureUrl ? (
                    <SecureYouTubePlayer
                      secureUrl={secureUrl}
                      title={selectedContent.title}
                      autoPlay={false}
                      contentId={selectedContent._id}
                      onComplete={() => {
                        fetchSectionAndContent();
                      }}
                    />
                  ) : (
                    <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                  )}
                </Suspense>
              ) : selectedContent.video?.storageType === 'cloudinary' ? (
                // Cloudinary Video Player
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    src={selectedContent.video.cloudinaryUrl}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    onEnded={() => {
                      // Use the centralized markAsCompleted function to avoid duplicate gamification events
                      markAsCompleted(selectedContent._id);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {selectedContent.title && (
                    <div className="bg-gray-900 p-4">
                      <h3 className="text-white font-semibold">{selectedContent.title}</h3>
                    </div>
                  )}
                </div>
              ) : (
                // Local Video Player (Default/Legacy)
                (selectedContent.videoPath ||
                  selectedContent.video?.storageType === 'local' ||
                  selectedContent.video?.path ||
                  selectedContent.video?.localPath ||
                  selectedContent.video?.storedName) && (
                  <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}> 
                    <EmbeddedVideoPlayer
                      videoUrl={`/api/content/${selectedContent._id}/stream`}
                      title={selectedContent.title}
                      autoPlay={false}
                      contentId={selectedContent._id}
                      onComplete={() => {
                        fetchSectionAndContent();
                      }}
                    />
                  </Suspense>
                )
              )}
              
              {/* Video Description Below */}
              {selectedContent.description && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About this video</h4>
                  <p className="text-gray-600 dark:text-gray-300">{selectedContent.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Materials and Links Section */}
          {selectedContent.materials && selectedContent.materials.length > 0 && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Useful Materials & Links
              </h3>
              <div className="space-y-3">
                {selectedContent.materials.map((material, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mr-2">
                            {material.type || 'link'}
                          </span>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {material.title}
                          </h4>
                        </div>
                        {material.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {material.description}
                          </p>
                        )}
                      </div>
                      <a
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition flex items-center whitespace-nowrap"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignment - Download */}
          {selectedContent.type === 'assignment' && (
            <>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Assignment File</h3>
                  <p className="text-gray-600 mb-4">{selectedContent.fileName}</p>
                  <button
                    type="button"
                    onClick={() => handleDownloadContentFile(selectedContent._id, selectedContent.title)}
                    disabled={downloadingContentId === selectedContent._id}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {downloadingContentId === selectedContent._id ? 'Starting download...' : 'Download Assignment'}
                  </button>
                  <p className="mt-4 text-sm text-gray-500">
                    Complete the assignment and submit it to your instructor
                  </p>
                </div>
              </div>

              {/* Materials for Assignment */}
              {selectedContent.materials && selectedContent.materials.length > 0 && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Useful Materials & Links
                  </h3>
                  <div className="space-y-3">
                    {selectedContent.materials.map((material, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mr-2">
                                {material.type || 'link'}
                              </span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {material.title}
                              </h4>
                            </div>
                            {material.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {material.description}
                              </p>
                            )}
                          </div>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition flex items-center whitespace-nowrap"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Project - Video + Starter File */}
          {selectedContent.type === 'project' && (
            <div className="space-y-6">
              {/* Project Video - Embedded */}
              {(selectedContent.video?.storageType === 'youtube' ||
                selectedContent.video?.storageType === 'cloudinary' ||
                selectedContent.videoPath ||
                selectedContent.video?.storageType === 'local' ||
                selectedContent.video?.path ||
                selectedContent.video?.localPath ||
                selectedContent.video?.storedName) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">📹 Project Tutorial</h3>
                  {selectedContent.video?.storageType === 'youtube' ? (
                    <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
                      {secureUrl ? (
                        <SecureYouTubePlayer
                          secureUrl={secureUrl}
                          title={selectedContent.title}
                          autoPlay={false}
                          contentId={selectedContent._id}
                          onComplete={() => {
                            fetchSectionAndContent();
                          }}
                        />
                      ) : (
                        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                      )}
                    </Suspense>
                  ) : selectedContent.video?.storageType === 'cloudinary' ? (
                    <div className="bg-black rounded-lg overflow-hidden">
                      <video
                        src={selectedContent.video.cloudinaryUrl}
                        className="w-full h-full"
                        controls
                        controlsList="nodownload"
                        onEnded={() => {
                          markAsCompleted(selectedContent._id);
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {selectedContent.title && (
                        <div className="bg-gray-900 p-4">
                          <h3 className="text-white font-semibold">{selectedContent.title}</h3>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmbeddedVideoPlayer
                      videoUrl={`/api/content/${selectedContent._id}/stream`}
                      title={selectedContent.title}
                      autoPlay={false}
                      contentId={selectedContent._id}
                      onComplete={() => {
                        fetchSectionAndContent();
                      }}
                    />
                  )}
                  {selectedContent.description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Project Description</h4>
                      <p className="text-gray-600">{selectedContent.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Project Starter File */}
              {(selectedContent.starterFilePath || selectedContent.file?.path || (selectedContent.file?.storageType === 'telegram' && selectedContent.file?.telegramFileId)) && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">📦 Starter Files</h3>
                  <div className="flex items-center justify-between bg-white rounded-md p-4 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedContent.starterFileName}</p>
                        <p className="text-sm text-gray-500">Project starter files</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadContentFile(selectedContent._id, selectedContent.title, { type: 'starter' })}
                      disabled={downloadingContentId === selectedContent._id}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {downloadingContentId === selectedContent._id ? 'Starting download...' : 'Download'}
                    </button>
                  </div>
                </div>
              )}

              {/* Materials for Project */}
              {selectedContent.materials && selectedContent.materials.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Useful Materials & Links
                  </h3>
                  <div className="space-y-3">
                    {selectedContent.materials.map((material, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mr-2">
                                {material.type || 'link'}
                              </span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {material.title}
                              </h4>
                            </div>
                            {material.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {material.description}
                              </p>
                            )}
                          </div>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition flex items-center whitespace-nowrap"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{section?.name}</h1>
                <p className="text-sm text-gray-500">
                  {section?.isFree ? '✅ Free Section' : `💰 ${formatPrice(section?.priceCents || 0, section?.currency || 'SYR')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-indigo-600">{getProgressPercentage()}%</p>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Course Content</h2>
          {renderContentSidebar()}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-white">
          {renderContentViewer()}
        </div>
      </div>

      {/* Video Player Modal - Removed (now using embedded player) */}
      {/* Videos now play directly in the content area like YouTube layout */}
    </div>
  );
};

export default StudentSectionContent;
