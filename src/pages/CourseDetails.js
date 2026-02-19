import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import CoursePrice from '../components/common/CoursePrice';
import { BookOpen, Clock, Users, ArrowLeft, DollarSign, Upload, Star } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

const CourseDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // null | 'pending' | 'enrolled'
  const [selectedGroup, setSelectedGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('none');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [paymentProviders, setPaymentProviders] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/courses/${id}`);
        setCourse(res.data.course);

        try {
          const publicSettingsRes = await axios.get('/api/admin/settings/public');
          const providers = Array.isArray(publicSettingsRes?.data?.data?.paymentProviders)
            ? publicSettingsRes.data.data.paymentProviders
            : [];
          setPaymentProviders(providers);
        } catch (_) {
          setPaymentProviders([]);
        }

        if (user && user.role === 'student') {
          try {
            const enrolledRes = await axios.get('/api/courses/enrolled');
            const match = (enrolledRes.data.enrolledCourses || []).find(e => e.course._id === id);
            if (match) setEnrollmentStatus(match.status);
          } catch (e) {
            // ignore if not authorized
          }
        }
        
        // Fetch ratings for this course
        try {
          const ratingsRes = await axios.get(`/api/ratings/course/${id}`);
          setRatings(ratingsRes.data.ratings || []);
        } catch (e) {
          console.error('Failed to load ratings:', e);
        } finally {
          setRatingsLoading(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const providerOptions = Array.isArray(paymentProviders)
    ? paymentProviders.filter((p) => p && p.key && p.name)
    : [];

  const openEnrollModal = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'student') return;
    if (!selectedGroup) return alert('Please select a group');
    
    // Fetch group details to check payment requirements
    try {
      const groupRes = await axios.get(`/api/groups/${selectedGroup}/enrollment-info`);
      setGroupDetails(groupRes.data.group);
      setShowEnrollModal(true);
    } catch (e) {
      alert('Failed to load group details');
    }
  };

  const register = async () => {
    if (!selectedGroup) return alert('Please select a group');
    
    // Validate payment info if group requires payment
    if (groupDetails && groupDetails.paymentType !== 'free' && groupDetails.enrollmentFee > 0) {
      if (!paymentMethod || paymentMethod === 'none') {
        return alert('Please select a payment method');
      }
      if (!receiptUrl) {
        return alert('Please provide receipt URL or upload receipt via messaging');
      }
    }
    
    try {
      setSubmitting(true);
      await axios.post(`/api/groups/${selectedGroup}/enroll`, { 
        paymentMethod,
        receiptUrl 
      });
      setEnrollmentStatus('pending');
      setShowEnrollModal(false);
      setPaymentMethod('none');
      setReceiptUrl('');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to enroll');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('courseNotFound')}</h2>
          <Link to="/" className="btn-primary">{t('backToHome')}</Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h1>
              {(course.instructor?.name || course.originalInstructor?.name) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {course.instructor?.name
                    ? `By ${course.instructor.name}`
                    : `Created by ${course.originalInstructor.name}`}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4" /> {course.duration} {t('weeks')}</span>
                <span className="inline-flex items-center gap-2"><Users className="w-4 h-4" /> {course.groups?.length || 0} {t('groups')}</span>
                <span className="inline-flex items-center gap-2"><BookOpen className="w-4 h-4" /> {t(course.level.toLowerCase())}</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('whatYoullLearn')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{t('courseCoversKeyTopics')}</p>
              </div>
            </div>
            <div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="mb-4">
                  <CoursePrice course={course} showTimer={true} className="text-left" />
                </div>

                {user ? (
                  user.role === 'student' ? (
                    user.status === 'suspended' || user.status === 'banned' ? (
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Account Suspended</p>
                        <p className="text-sm text-red-500 dark:text-red-300">You are suspended. Please contact support.</p>
                      </div>
                    ) : enrollmentStatus === 'enrolled' ? (
                      <Link to={`/student/course/${course._id}`} className="btn-primary w-full text-center block">{t('continueCourse')}</Link>
                    ) : enrollmentStatus === 'pending' ? (
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('enrollmentPendingApproval')}</div>
                        <button className="btn-secondary w-full" disabled>{t('pending')}</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="label">{t('selectGroup')}</label>
                          <select className="input-field w-full" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                            <option value="">{t('chooseAGroup')}</option>
                            {(course.groups || []).map(g => (
                              <option key={g._id} value={g._id}>{g.name || t('group')}</option>
                            ))}
                          </select>
                        </div>
                        <button onClick={openEnrollModal} className="btn-primary w-full" disabled={!selectedGroup}>{t('continueToEnrollment')}</button>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">{t('loginAsStudentToEnroll')}</div>
                      <Link to="/login" className="btn-primary w-full text-center block">{t('login')}</Link>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('createAccountOrLogin')}</div>
                    <div className="flex gap-2">
                      <Link to="/login" className="btn-secondary w-1/2 text-center">{t('login')}</Link>
                      <Link to="/register" className="btn-primary w-1/2 text-center">{t('register')}</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Course Ratings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('studentReviews')}</h2>
          
          {ratingsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : ratings.length > 0 ? (
            <div className="space-y-6">
              {ratings.map((rating) => (
                <div key={rating._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    {rating.student?.avatar ? (
                      <img
                        src={`${axios.defaults.baseURL || 'http://localhost:5000'}${rating.student.avatar}`}
                        alt={rating.student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {rating.student?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {rating.student?.name || t('anonymous')}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {rating.student?.jobRole || t('learner')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < rating.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.review && (
                        <p className="text-gray-700 dark:text-gray-300 mt-2">
                          {rating.review}
                        </p>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('noReviewsYet')}</p>
            </div>
          )}
        </motion.div>

        {/* Enrollment Modal with Payment */}
        {showEnrollModal && groupDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('completeEnrollment')}</h3>
                <button onClick={() => setShowEnrollModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">✕</button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('group')}</div>
                  <div className="font-medium text-gray-900 dark:text-white">{groupDetails.name}</div>
                </div>

                {groupDetails.paymentType !== 'free' && groupDetails.enrollmentFee > 0 ? (
                  <>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <div className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">{t('paymentRequired')}</div>
                          <div className="text-sm text-yellow-800 dark:text-yellow-300">
                            {t('groupRequiresPayment')} {groupDetails.paymentType === 'monthly' ? t('monthly') : t('perSection')} {t('paymentOf')} <strong>${groupDetails.enrollmentFee}</strong>.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="label">{t('paymentMethod')} *</label>
                      <select 
                        className="input-field" 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="none">{t('selectPaymentMethod')}</option>
                        {providerOptions.length > 0 ? (
                          providerOptions.map((p) => (
                            <option key={p.key} value={p.key}>{p.name}</option>
                          ))
                        ) : (
                          <option value="other">Other</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="label">{t('paymentReceiptUrl')} *</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="https://example.com/receipt.jpg"
                        value={receiptUrl}
                        onChange={(e) => setReceiptUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('uploadReceiptInstruction')}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          {t('canAlsoUploadViaMessages')} <Link to="/messages" className="underline font-medium">{t('messagesPage')}</Link> {t('pageToInstructorOrAdmin')}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-sm text-green-800 dark:text-green-300">
                      {t('freeGroupEnrollImmediately')}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowEnrollModal(false)} 
                    className="btn-secondary"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={register} 
                    className="btn-primary" 
                    disabled={submitting}
                  >
                    {submitting ? t('enrolling') : t('confirmEnrollment')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        </div>
      </div>
    </PageTransition>
  );
};

export default CourseDetails;
