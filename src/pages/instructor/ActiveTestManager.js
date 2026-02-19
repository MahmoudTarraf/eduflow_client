import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Clock,
  Users,
  BarChart3,
  ArrowLeft,
  FileText,
  Award,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { isInstructorRestricted } from '../../utils/restrictions';

const ActiveTestManager = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cannotManageTests = isInstructorRestricted(user, 'manageActiveTests');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [sectionInfo, setSectionInfo] = useState(null);

  useEffect(() => {
    fetchTests();
    fetchSectionInfo();
  }, [sectionId]);

  const fetchSectionInfo = async () => {
    try {
      const response = await axios.get(`/api/sections/${sectionId}`);
      setSectionInfo(response.data.section);
    } catch (error) {
      console.error('Error fetching section:', error);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/active-tests/section/${sectionId}`);
      setTests(response.data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (cannotManageTests) {
      toast.error('Your instructor account is suspended. You cannot delete tests right now.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this test? All student attempts will be deleted.')) {
      return;
    }

    try {
      await axios.delete(`/api/active-tests/${testId}`);
      await fetchTests();
      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error(error.response?.data?.message || 'Failed to delete test');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Active Tests
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {sectionInfo?.name || 'Section'} - Manage timed tests for your students
              </p>
            </div>
            <button
              onClick={() => {
                if (cannotManageTests) {
                  toast.error('Your instructor account is suspended. You cannot create tests right now.');
                  return;
                }
                setShowCreateModal(true);
              }}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cannotManageTests}
            >
              <Plus className="w-5 h-5" />
              <span>Create Test</span>
            </button>
          </div>
        </motion.div>

        {cannotManageTests && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100 px-4 py-3 rounded">
            Your instructor account is currently suspended from managing active tests. You can view existing tests and statistics, but creating, editing, and deleting tests is disabled.
          </div>
        )}

        {/* Tests List */}
        {tests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-12"
          >
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No active tests yet
            </p>
            <button
              onClick={() => {
                if (cannotManageTests) {
                  toast.error('Your instructor account is suspended. You cannot create tests right now.');
                  return;
                }
                setShowCreateModal(true);
              }}
              disabled={cannotManageTests}
              className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Test</span>
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {tests.map((test, index) => (
              <motion.div
                key={test._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {test.title}
                    </h3>
                    {test.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {test.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span>{test.questions.length} Questions</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{test.timeLimitMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Award className="w-4 h-4" />
                        <span>Passing: {test.passingScore}%</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>Max {test.maxAttempts} Attempt{test.maxAttempts > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {!test.isActive && (
                      <div className="mt-4 flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Test is currently inactive</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/instructor/tests/${test._id}/statistics`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View Statistics"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (cannotManageTests) {
                          toast.error('Your instructor account is suspended. You cannot edit tests right now.');
                          return;
                        }
                        navigate(`/instructor/tests/${test._id}/edit`);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit Test"
                      disabled={cannotManageTests}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Test"
                      disabled={cannotManageTests}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <TestFormModal
          sectionId={sectionId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTests();
          }}
        />
      )}
    </div>
  );
};

// Test Form Modal Component
const TestFormModal = ({ sectionId, testData, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    // Navigate to test creation page
    navigate(`/instructor/tests/create/${sectionId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Active Test
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Active tests are timed assessments that students must complete within a specific time limit.
          Questions are automatically graded when submitted.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Features:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Multiple choice questions with automatic grading</li>
            <li>• Countdown timer visible to students</li>
            <li>• Auto-submit when time expires</li>
            <li>• Immediate results and feedback</li>
            <li>• Performance statistics for instructors</li>
          </ul>
        </div>

        <button
          onClick={handleCreateClick}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Continue to Test Builder</span>
        </button>
      </motion.div>
    </div>
  );
};

export default ActiveTestManager;
