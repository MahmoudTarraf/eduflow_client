import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fireGamificationEvents } from '../../utils/gamificationUtils';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  ArrowLeft,
  Timer
} from 'lucide-react';
import axios from 'axios';

const TakeActiveTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    startTest();
  }, [testId]);

  // Timer effect
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress') return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(attempt.endTime).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      setTimeRemaining(remaining);

      // Show warning at 5 minutes
      if (remaining === 300 && !showWarning) {
        setShowWarning(true);
        alert('5 minutes remaining!');
      }

      // Auto-submit when time expires
      if (remaining === 0) {
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, showWarning]);

  const startTest = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/active-tests/${testId}/start`);
      setTest(response.data.test);
      setAttempt(response.data.attempt);

      // Initialize answers array
      const initialAnswers = response.data.test.questions.map(q => ({
        questionId: q._id,
        selectedOptionIndex: null
      }));
      setAnswers(initialAnswers);

      // Calculate initial time remaining
      const now = new Date().getTime();
      const end = new Date(response.data.attempt.endTime).getTime();
      setTimeRemaining(Math.floor((end - now) / 1000));
    } catch (error) {
      console.error('Error starting test:', error);
      
      // Check if max attempts reached and we should show results
      if (error.response?.data?.showResults && error.response?.data?.attemptId) {
        navigate(`/student/test-results/${error.response.data.attemptId}`);
        return;
      }
      
      alert(error.response?.data?.message || 'Failed to start test');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    const updated = [...answers];
    updated[questionIndex].selectedOptionIndex = optionIndex;
    setAnswers(updated);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      // Check if all questions are answered
      const unanswered = answers.filter(a => a.selectedOptionIndex === null).length;
      if (unanswered > 0) {
        if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
          return;
        }
      } else {
        if (!window.confirm('Are you sure you want to submit your test?')) {
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`/api/active-tests/${testId}/submit`, {
        attemptId: attempt._id,
        answers: answers.map(a => ({
          questionId: a.questionId,
          selectedOptionIndex: a.selectedOptionIndex ?? 0
        }))
      });

      // Fire gamification events using centralized utility
      console.log('🧪 TakeActiveTest: Test submission response:', response?.data);
      try {
        if (response?.data?.gamification) {
          console.log('🧪 TakeActiveTest: Firing gamification events for test completion');
          fireGamificationEvents(response.data.gamification);
        } else {
          console.log('🧪 TakeActiveTest: No gamification data in response');
        }
      } catch (error) {
        console.error('🧪 TakeActiveTest: Error firing gamification events:', error);
      }

      // Navigate to results page
      navigate(`/student/test-results/${response.data.attempt._id}`, {
        state: { attempt: response.data.attempt, autoSubmitted: autoSubmit }
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      alert(error.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 300) return 'text-green-600 dark:text-green-400';
    if (timeRemaining > 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!test || !attempt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Test Not Available
          </h2>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Timer Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {test.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Attempt #{attempt.attemptNumber} of {test.maxAttempts}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
                <Clock className="w-6 h-6" />
                <span className="text-2xl font-mono font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        {timeRemaining <= 300 && timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
              <Timer className="w-5 h-5" />
              <p className="font-medium">
                {timeRemaining > 60 
                  ? `${Math.floor(timeRemaining / 60)} minutes remaining` 
                  : `${timeRemaining} seconds remaining`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {test.questions.map((question, qIndex) => (
            <motion.div
              key={question._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIndex * 0.05 }}
              className="card"
            >
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold">
                  {qIndex + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {question.questionText}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {question.points} point{question.points > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2 ml-11">
                {question.options.map((option, oIndex) => (
                  <label
                    key={oIndex}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[qIndex]?.selectedOptionIndex === oIndex
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={answers[qIndex]?.selectedOptionIndex === oIndex}
                      onChange={() => handleAnswerSelect(qIndex, oIndex)}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="flex-1 text-gray-900 dark:text-white">
                      {option.optionText}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {answers.filter(a => a.selectedOptionIndex !== null).length} / {test.questions.length} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
              style={{
                width: `${(answers.filter(a => a.selectedOptionIndex !== null).length / test.questions.length) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="btn-primary flex items-center space-x-2 text-lg px-8 py-3"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? 'Submitting...' : 'Submit Test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeActiveTest;
