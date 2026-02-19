import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Star, X, Award, Eye, Download, FileText } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import useCelebration from '../../hooks/useCelebration';

const StudentCertificates = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [eligibleCourses, setEligibleCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [canRateCourses, setCanRateCourses] = useState({});
  const { hasShownCelebration, markCelebrationShown } = useCelebration();

  useEffect(() => {
    fetchCertificates();
    fetchAllRequests();
    fetchEligibleCourses();
  }, []);

  useEffect(() => {
    // Check rating eligibility for all certificates
    const checkRatingEligibility = async () => {
      if (certificates.length > 0) {
        const eligibilityMap = {};
        for (const cert of certificates) {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/ratings/can-rate/${cert.course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            eligibilityMap[cert.course._id] = response.data.canRate;
          } catch (error) {
            console.error('Error checking rating eligibility:', error);
            eligibilityMap[cert.course._id] = false;
          }
        }
        setCanRateCourses(eligibilityMap);
      }
    };
    
    checkRatingEligibility();
  }, [certificates]);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch issued certificates
      const res = await axios.get('/api/certificates/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newCertificates = res.data.certificates || [];
      
      // Check for newly issued certificates and trigger celebration
      if (newCertificates.length > certificates.length) {
        const latestCert = newCertificates[0]; // Assuming newest first
        const eventKey = `certificate_${user?.id}_${latestCert.course?._id}`;

        if (!hasShownCelebration(eventKey)) {
          window.dispatchEvent(
            new CustomEvent('gamification:notify', {
              detail: {
                eventType: 'certificateReceived',
                message: null,
                userName: user?.name,
                courseName: latestCert.course?.name,
                userRole: 'student'
              }
            })
          );

          markCelebrationShown(eventKey);
        }
      }
      
      setCertificates(newCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch certificates');
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all certificate requests
      const res = await axios.get('/api/certificates/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAllRequests(res.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch enrolled courses (includes course and grade info)
      const res = await axios.get('/api/certificates/my-eligibility', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const eligible = res.data.enrolledCourses || [];

      setEligibleCourses(eligible);
    } catch (error) {
      console.error('Error fetching eligible courses:', error);
    }
  };

  const handleRequestCertificate = async (courseId, groupId) => {
    if (user?.status === 'suspended' && user?.restrictions?.requestCertificate) {
      toast.error('Your account is suspended. You cannot request certificates.');
      return;
    }

    try {
      setRequesting(prev => ({ ...prev, [courseId]: true }));
      
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/certificates/request', {
        courseId,
        groupId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(res.data.message);
      fetchCertificates(); // Refresh the certificates list
      fetchAllRequests(); // Refresh all requests
      fetchEligibleCourses(); // Refresh eligible courses
    } catch (error) {
      console.error('Error requesting certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to request certificate');
    } finally {
      setRequesting(prev => {
        const newState = { ...prev };
        delete newState[courseId];
        return newState;
      });
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/ratings', {
        course: selectedCertificate.course._id,
        rating,
        review: review.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Thank you for your rating!');
      setShowRatingModal(false);
      setRating(0);
      setReview('');
      
      // Update canRateCourses to remove this course
      setCanRateCourses(prev => ({
        ...prev,
        [selectedCertificate.course._id]: false
      }));
      
      setSelectedCertificate(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const downloadCertificate = async (certificateUrl, filename) =>{
    try {
      const token = localStorage.getItem('token');
      const fullUrl = certificateUrl.startsWith('http') 
        ? certificateUrl 
        : `${axios.defaults.baseURL || ''}${certificateUrl}`;
      
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'certificate.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="mt-2 h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[0,1,2,3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="ltr:ml-4 rtl:mr-4 flex-1">
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="mt-2 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
                <div className="mt-6 h-9 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {t('myCertificates')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('viewAndRequestCertificates')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Issued Certificates */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('issuedCertificates')}
            </h2>
            
            {certificates.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center shadow-sm">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {t('noCertificatesYet')}
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  {t('completeCoursesWith70')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {certificates.map((certificate) => (
                  <div key={certificate._id} className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center ring-1 ring-indigo-200 dark:ring-indigo-700">
                            <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                        <div className="ltr:ml-4 rtl:mr-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {certificate.course?.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('grade')}: {certificate.courseGrade}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {t('issued')}
                          </span>
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => {
                                const fullUrl = certificate.certificateFile?.url?.startsWith('http') 
                                  ? certificate.certificateFile.url 
                                  : `${axios.defaults.baseURL || 'http://localhost:5000'}${certificate.certificateFile?.url}`;
                                window.open(fullUrl, '_blank');
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <Eye className="h-5 w-5" />
                              {t('view')}
                            </button>
                            <button
                              onClick={() => downloadCertificate(certificate.certificateFile?.url, certificate.certificateFile?.originalName)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Download className="h-5 w-5" />
                              {t('download')}
                            </button>
                          </div>
                        </div>
                        
                        {/* Rate Course Button */}
                        {canRateCourses[certificate.course?._id] && (
                          <button
                            onClick={() => {
                              setSelectedCertificate(certificate);
                              setShowRatingModal(true);
                            }}
                            className="w-full mt-2 inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            <Star className="mr-2 h-5 w-5" />
                            {t('rateThisCourse')}
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p>{t('issuedOn')}: {new Date(certificate.issuedAt).toLocaleDateString()}</p>
                        <p>{t('group')}: {certificate.group?.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Eligible Courses for Certificate Request */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('requestCertificate')}
            </h2>
            
            {eligibleCourses.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center shadow-sm">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {t('noEligibleCourses')}
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  {t('keepLearningToEarnCertificates')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {eligibleCourses.map((course) => {
                  // Check if certificate already requested for this course
                  const existingRequest = allRequests.find(req => req.course?._id === course.course?._id);
                  
                  const courseDoc = course.course;
                  const mode = courseDoc?.certificateMode || 'automatic';
                  const modeKey =
                    mode === 'manual_instructor'
                      ? 'certificateModeManualInstructor'
                      : mode === 'automatic'
                        ? 'certificateModeAutomatic'
                        : 'certificateModeDisabled';
                  const status = course.eligibilityStatus;
                  const details = course.eligibilityDetails || {};
                  const certificatesDisabled = status === 'CERTIFICATES_DISABLED';
                  const offersCertificate = courseDoc?.offersCertificate !== false && mode !== 'disabled' && !certificatesDisabled;
                  let canRequestFromEligibility = status === 'AUTO_GRANT' || status === 'CAN_REQUEST';

                  // In automatic mode, also treat the student as eligible when fully completed
                  // and overall grade meets or exceeds the passing grade, even if status
                  // was not explicitly AUTO_GRANT/CAN_REQUEST (for robustness when toggling modes).
                  if (!canRequestFromEligibility && mode === 'automatic') {
                    const passingGrade =
                      typeof details.passingGrade === 'number' ? details.passingGrade : 60;
                    const overallGrade =
                      typeof details.overallGrade === 'number' ? details.overallGrade : 0;
                    const completion =
                      typeof details.completionPercentage === 'number'
                        ? details.completionPercentage
                        : 0;

                    const gradeOk = overallGrade >= passingGrade;
                    const completionOk = completion >= 100;

                    if (gradeOk && completionOk) {
                      canRequestFromEligibility = true;
                    }
                  }
                  const waitingForInstructor =
                    status === 'GROUP_COMPLETED_AND_ELIGIBLE' &&
                    details.certificateMode === 'manual_instructor' &&
                    details.instructorCertificateRelease === false;
                  const groupNotCompleted = status === 'GROUP_NOT_COMPLETED';
                  const gradeTooLow = status === 'GROUP_COMPLETED_BUT_GRADE_TOO_LOW';
                  
                  // Show request button if: no request OR request was rejected, AND course offers certificates under current mode
                  const isCertificateRestricted =
                    user?.status === 'suspended' && user?.restrictions?.requestCertificate;

                  const canRequest =
                    offersCertificate &&
                    canRequestFromEligibility &&
                    !isCertificateRestricted &&
                    (!existingRequest || existingRequest.status === 'rejected');
                  // Show status badge only if pending or issued (not rejected - allow re-request)
                  const showStatus = existingRequest && existingRequest.status !== 'rejected';
                  
                  return (
                    <div key={course._id} className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {course.course?.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('grade')}: {course.overallGrade || 0}%
                            </p>
                          </div>
                          {showStatus ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              existingRequest.status === 'issued' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {existingRequest.status === 'issued' ? t('delivered') : t('pending')}
                            </span>
                          ) : !offersCertificate ? (
                            <div className="text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                No Certificate
                              </span>
                            </div>
                          ) : canRequest ? (
                            <button
                              onClick={() => handleRequestCertificate(course.course._id, course.group?._id)}
                              disabled={requesting[course.course._id]}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              {requesting[course.course._id] ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : null}
                              {existingRequest?.status === 'rejected' ? t('requestAgain') : t('request')}
                            </button>
                          ) : null}
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                          <p>{t('group')}: {course.group?.name}</p>
                          {!offersCertificate && (
                            <p className="mt-2 text-amber-600 dark:text-amber-400 font-medium">
                              {t('certificateStatusCertificatesDisabled')}
                            </p>
                          )}
                          {offersCertificate && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('certificateModeLabel')}{': '} {t(modeKey)}
                              </p>
                              <p className="font-medium text-gray-700 dark:text-gray-300">
                                {t('certificateStatus')}{': '}
                                {canRequestFromEligibility
                                  ? t('certificateStatusEligible')
                                  : waitingForInstructor
                                    ? t('certificateStatusWaitingInstructor')
                                    : t('certificateStatusNotEligible')}
                              </p>
                              {groupNotCompleted && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('certificateReasonGroupNotCompleted')}
                                </p>
                              )}
                              {gradeTooLow && typeof details.passingGrade === 'number' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('certificateReasonGradeTooLow', {
                                    passingGrade: Math.round(details.passingGrade),
                                  })}
                                </p>
                              )}
                              {typeof details.totalItems === 'number' &&
                                typeof details.completedItems === 'number' &&
                                typeof details.completionPercentage === 'number' && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('certificateProgressLabel')}{': '}
                                    {t('certificateProgressValue', {
                                      completed: details.completedItems,
                                      total: details.totalItems,
                                      percentage: details.completionPercentage,
                                    })}
                                  </p>
                                )}
                            </div>
                          )}
                          {existingRequest?.status === 'rejected' && existingRequest.rejectionReason && (
                            <p className="mt-2 text-red-600 dark:text-red-400">
                              {t('previousRejectionReason')}: {existingRequest.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('rateCourse')}
              </h2>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReview('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('course')}: <span className="font-semibold text-gray-900 dark:text-white">{selectedCertificate.course?.name}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t('feedbackHelpsOthers')}
              </p>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('rating')} *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {rating} {rating === 1 ? t('star') : t('stars')}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('yourReview')}
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder={t('shareYourExperience')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {review.length}/1000 {t('characters')}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setReview('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('skipForNow')}
                </button>
                <button
                  type="submit"
                  disabled={rating === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Star className="w-4 h-4" />
                  <span>{t('submitRating')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentCertificates;
