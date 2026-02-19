import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  Clock,
  Award,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { isInstructorRestricted } from '../../utils/restrictions';

const CreateActiveTest = () => {
  const { sectionId, testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cannotManageTests = isInstructorRestricted(user, 'manageActiveTests');
  const [loading, setLoading] = useState(false);
  const [sectionInfo, setSectionInfo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 30,
    passingScore: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultsImmediately: true,
    showCorrectAnswers: true,
    isActive: true
  });
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ],
      points: 1,
      order: 0
    }
  ]);

  useEffect(() => {
    if (testId) {
      // If editing, fetch test first to get section ID
      fetchTest();
    } else if (sectionId) {
      // If creating new test, fetch section info
      fetchSectionInfo(sectionId);
    }
  }, [sectionId, testId]);

  const fetchSectionInfo = async (sId) => {
    try {
      if (!sId) return;
      const response = await axios.get(`/api/sections/${sId}`);
      setSectionInfo(response.data.data || response.data.section);
    } catch (error) {
      console.error('Error fetching section:', error);
    }
  };

  const fetchTest = async () => {
    try {
      const response = await axios.get(`/api/active-tests/${testId}`);
      const test = response.data.test;
      
      // Extract section ID from test (it could be an object or string)
      const extractedSectionId = typeof test.section === 'object' ? test.section._id : test.section;
      
      setFormData({
        title: test.title,
        description: test.description,
        timeLimitMinutes: test.timeLimitMinutes,
        passingScore: test.passingScore,
        maxAttempts: test.maxAttempts,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
        showResultsImmediately: true, // Always true
        showCorrectAnswers: true, // Always true
        isActive: test.isActive
      });
      setQuestions(test.questions);
      
      // Fetch section info using the test's section ID
      if (extractedSectionId) {
        fetchSectionInfo(extractedSectionId);
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to load test');
      navigate(-1);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ],
        points: 1,
        order: questions.length
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      toast.error('Test must have at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const addOption = (questionIndex) => {
    const updated = [...questions];
    updated[questionIndex].options.push({ optionText: '', isCorrect: false });
    setQuestions(updated);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length <= 2) {
      toast.error('Question must have at least 2 options');
      return;
    }
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex][field] = value;
    setQuestions(updated);
  };

  const toggleCorrectAnswer = (questionIndex, optionIndex) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex].isCorrect = !updated[questionIndex].options[optionIndex].isCorrect;
    setQuestions(updated);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a test title');
      return false;
    }

    if (formData.timeLimitMinutes < 1 || formData.timeLimitMinutes > 300) {
      toast.error('Time limit must be between 1 and 300 minutes');
      return false;
    }

    if (formData.passingScore < 0 || formData.passingScore > 100) {
      toast.error('Passing score must be between 0 and 100');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1} text is required`);
        return false;
      }

      if (q.options.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options`);
        return false;
      }

      const hasCorrect = q.options.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        toast.error(`Question ${i + 1} must have at least one correct answer`);
        return false;
      }

      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].optionText.trim()) {
          toast.error(`Question ${i + 1}, Option ${j + 1} text is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cannotManageTests) {
      toast.error('Your instructor account is suspended. You cannot create or update tests right now.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!sectionInfo) {
      toast.error('Section information not loaded. Please try again.');
      return;
    }

    if (!sectionInfo.course || !sectionInfo.group) {
      toast.error('Invalid section data. Please select a valid section.');
      return;
    }

    try {
      setLoading(true);

      // Extract section ID - use from URL params or from sectionInfo
      const actualSectionId = sectionId || (typeof sectionInfo._id === 'string' ? sectionInfo._id : sectionInfo._id?.toString());
      
      const payload = {
        ...formData,
        sectionId: actualSectionId,
        courseId: typeof sectionInfo.course === 'object' ? sectionInfo.course._id : sectionInfo.course,
        groupId: typeof sectionInfo.group === 'object' ? sectionInfo.group._id : sectionInfo.group,
        questions: questions.map((q, index) => ({
          ...q,
          order: index
        }))
      };

      if (testId) {
        const response = await axios.put(`/api/active-tests/${testId}`, payload);
        toast.success(response.data.message || 'Test updated successfully!');
        if (response.data.hasAttempts) {
          console.log('Note: Students have already taken this test');
        }
      } else {
        await axios.post('/api/active-tests', payload);
        toast.success('Test created successfully!');
      }

      navigate(-1);
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(error.response?.data?.message || 'Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {testId ? 'Edit Active Test' : 'Create Active Test'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sectionInfo?.name || 'Section'}
          </p>
        </motion.div>

        {cannotManageTests && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100 px-4 py-3 rounded">
            Your instructor account is currently suspended from managing active tests. You can view existing test configuration, but creating or updating tests is disabled.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Brief description of what this test covers..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time Limit (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimitMinutes}
                    onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    max="300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Award className="w-4 h-4 inline mr-1" />
                    Passing Score (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                    className="input-field"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Attempts *
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffleQuestions}
                    onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Shuffle Questions
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.shuffleOptions}
                    onChange={(e) => setFormData({ ...formData, shuffleOptions: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Shuffle Options
                  </span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIndex * 0.05 }}
                className="card border-l-4 border-primary-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Question {qIndex + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                      className="w-20 input-field text-sm"
                      min="1"
                      placeholder="Points"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                      className="input-field"
                      rows={2}
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Options (Select correct answer)
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qIndex)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Option</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              option.isCorrect
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {option.isCorrect && <CheckCircle className="w-4 h-4 text-white" />}
                          </button>
                          <input
                            type="text"
                            value={option.optionText}
                            onChange={(e) => updateOption(qIndex, oIndex, 'optionText', e.target.value)}
                            className="input-field flex-1"
                            placeholder={`Option ${oIndex + 1}`}
                            required
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : testId ? 'Update Test' : 'Create Test'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateActiveTest;
