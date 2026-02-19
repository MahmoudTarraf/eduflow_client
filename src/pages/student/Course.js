import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  FileText,
  Video,
  File,
  ArrowLeft,
  Lock,
  AlertCircle,
  CreditCard,
  Receipt,
  XCircle
} from 'lucide-react';
import axios from 'axios';

import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const StudentCourse = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lectures');
  const [courseSummary, setCourseSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentUploading, setPaymentUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [selectedSectionPayment, setSelectedSectionPayment] = useState(null);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setSummaryLoading(true);

      // Check if user is suspended and blocked from accessing courses
      if (user?.status === 'suspended' && user?.restrictions?.accessCoursePages) {
        toast.error('Your account is suspended. You cannot access course pages.');
        navigate('/student');
        return;
      }

      const [courseResponse, progressResponse, summaryResponse] = await Promise.all([
        axios.get(`/api/courses/${id}`),
        axios.get(`/api/courses/${id}/progress`),
        axios.get(`/api/courses/${id}/summary`)
      ]);
      
      setCourse(courseResponse.data.course);
      setProgress(progressResponse.data.progress);
      setCourseSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast.error(error.response?.data?.message || 'Failed to load course details');
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  useEffect(() => {
    // Redirect to new course details page
    navigate(`/student/course/${id}/details`);
  }, [id, navigate]);

  const updateProgress = async (type, itemId, data) => {
    try {
      await axios.put(`/api/courses/${id}/progress`, {
        type,
        itemId,
        ...data
      });
      fetchCourseData(); // Refresh data
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getCompletionStatus = (itemId, type) => {
    if (!progress) return false;
    
    switch (type) {
      case 'lecture':
        return progress.lectures.find(l => l.lecture === itemId)?.completed || false;
      case 'assignment':
        return progress.assignments.find(a => a.assignment === itemId)?.submitted || false;
      case 'project':
        return progress.projects.find(p => p.project === itemId)?.submitted || false;
      default:
        return false;
    }
  };

  const allSectionsUnlocked = (courseSummary?.sections || []).every((section) => section.access?.isUnlocked);
  const overallGrade = courseSummary?.overallGrade ?? null;

  const PaymentModal = ({ open, onClose, section, courseId, uploading, receiptFile, setReceiptFile, onSubmit }) => {
    // ...
  };

  const CourseAccessStatus = ({ courseSummary, onPay }) => {
    // ...
  };

  const LockedSectionMessage = ({ sections, onPay }) => {
    // ...
  };

  const CertificateSection = ({ courseId, courseName, courseSummary, overallGrade }) => {
    // ...
  };

  if (loading || summaryLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Course not found
          </h2>
          <Link to="/student" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Link
            to="/student"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {course.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {course.description}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {progress?.overallProgress?.total || 0}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress?.overallProgress?.total || 0}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'lectures', name: t('lectures'), count: course.lectures?.length || 0 },
                { id: 'assignments', name: t('assignments'), count: course.assignments?.length || 0 },
                { id: 'projects', name: t('projects'), count: course.projects?.length || 0 },
                { id: 'certificate', name: t('certificate'), count: 1 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Payment + Grade Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <CourseAccessStatus
            courseSummary={courseSummary}
            onPay={(section) => {
              setSelectedSectionPayment(section);
              setReceiptFile(null);
              setPaymentModalOpen(true);
            }}
          />
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {activeTab === 'lectures' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('lectures')}
              </h3>
              {!allSectionsUnlocked ? (
                <LockedSectionMessage sections={courseSummary?.sections || []} onPay={(section) => {
                  setSelectedSectionPayment(section);
                  setReceiptFile(null);
                  setPaymentModalOpen(true);
                }} />
              ) : course.lectures?.length === 0 ? (
                <div className="card text-center py-12">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No lectures available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.lectures.map((lecture, index) => {
                    const isCompleted = getCompletionStatus(lecture._id, 'lecture');
                    return (
                      <div key={lecture._id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="font-medium">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {lecture.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {lecture.type === 'video' ? 'Video' : 'PDF'} • {lecture.duration || 0} min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {lecture.type === 'video' ? (
                              <button
                                onClick={async () => {
                                  try {
                                    // Update progress first
                                    updateProgress('lecture', lecture._id, { watched: true, completed: true });

                                    // Find the group and navigate to section content
                                    const enrolledRes = await axios.get('/api/courses/enrolled');
                                    const enrollment = (enrolledRes.data.enrolledCourses || []).find(e => e.course._id === id);

                                    if (enrollment?.group) {
                                      // Navigate to group sections with lecture parameter
                                      navigate(`/student/groups/${enrollment.group}/sections?lecture=${lecture._id}`);
                                    } else {
                                      // Fallback: navigate to sections list
                                      navigate('/student/sections');
                                    }
                                  } catch (error) {
                                    console.error('Error navigating to video:', error);
                                    navigate('/student/sections');
                                  }
                                }}
                                className="btn-primary flex items-center space-x-2"
                              >
                                <Play className="w-4 h-4" />
                                <span>{t('watch')}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => updateProgress('lecture', lecture._id, { watched: true, completed: true })}
                                className="btn-primary flex items-center space-x-2"
                              >
                                <FileText className="w-4 h-4" />
                                <span>{t('read')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('assignments')}
              </h3>
              {!allSectionsUnlocked ? (
                <LockedSectionMessage sections={courseSummary?.sections || []} onPay={(section) => {
                  setSelectedSectionPayment(section);
                  setReceiptFile(null);
                  setPaymentModalOpen(true);
                }} />
              ) : course.assignments?.length === 0 ? (
                <div className="card text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No assignments available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.assignments.map((assignment, index) => {
                    const isSubmitted = getCompletionStatus(assignment._id, 'assignment');
                    return (
                      <div key={assignment._id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSubmitted 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {isSubmitted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="font-medium">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {assignment.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {assignment.fileUrl && (
                              <button className="btn-secondary flex items-center space-x-2">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            )}
                            <button
                              onClick={() => updateProgress('assignment', assignment._id, { submitted: true })}
                              className="btn-primary flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{isSubmitted ? 'Resubmit' : t('submit')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('projects')}
              </h3>
              {course.projects?.length === 0 ? (
                <div className="card text-center py-12">
                  <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No projects available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.projects.map((project, index) => {
                    const isSubmitted = getCompletionStatus(project._id, 'project');
                    return (
                      <div key={project._id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isSubmitted
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {isSubmitted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <span className="font-medium">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {project.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {project.videos?.length || 0} videos • {project.files?.length || 0} files
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="btn-secondary flex items-center space-x-2">
                              <Play className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => updateProgress('project', project._id, { submitted: true })}
                              className="btn-primary flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{isSubmitted ? 'Resubmit' : t('submit')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'certificate' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Certificate
              </h3>
              <CertificateSection
                courseId={id}
                courseName={course.name}
                courseSummary={courseSummary}
                overallGrade={overallGrade}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentCourse;
