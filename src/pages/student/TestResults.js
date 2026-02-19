import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Award,
  Clock,
  TrendingUp,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  PartyPopper
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

const TestResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);

  useEffect(() => {
    // If attempt passed via state, use it; otherwise fetch
    if (location.state?.attempt) {
      processAttempt(location.state.attempt);
    } else {
      fetchAttempt();
    }
  }, [attemptId]);

  useEffect(() => {
    // Trigger confetti if passed
    if (attempt && attempt.passed && location.state?.autoSubmitted === false) {
      triggerConfetti();
    }
  }, [attempt]);

  const fetchAttempt = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/active-tests/attempts/${attemptId}`);
      if (response.data.attempt) {
        processAttempt(response.data.attempt);
      } else {
        throw new Error('Attempt not found');
      }
    } catch (error) {
      console.error('Error fetching attempt:', error);
      alert('Failed to load test results');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const processAttempt = async (attemptData) => {
    try {
      setAttempt(attemptData);
      // Fetch test details
      // Ensure test ID is a string, not an object
      const testId = attemptData.test?._id || attemptData.test;
      const testResponse = await axios.get(`/api/active-tests/${testId}`);
      setTest(testResponse.data.test);
    } catch (error) {
      console.error('Error processing attempt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = () => {
    // Navigate to course page using section info from attempt
    if (attempt?.section) {
      const sectionId = typeof attempt.section === 'object' ? attempt.section._id : attempt.section;
      const courseId = typeof attempt.course === 'object' ? attempt.course._id : attempt.course;
      navigate(`/student/course/${courseId}`);
    } else {
      navigate(-1);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!attempt || !test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Results Not Available
          </h2>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const correctAnswers = attempt.answers.filter(a => a.isCorrect).length;
  const totalQuestions = test.questions.length;
  const hasAttemptsLeft = !attempt.passed && attempt.attemptNumber < test.maxAttempts;
  const attemptsExhausted = !attempt.passed && attempt.attemptNumber >= test.maxAttempts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBackNavigation}
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Test Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {test.title}
          </p>
        </motion.div>

        {/* Auto-submit warning */}
        {attempt.autoSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">
                This test was automatically submitted due to time expiration.
              </p>
            </div>
          </motion.div>
        )}

        {/* Result Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`card mb-8 ${
            attempt.passed
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800'
              : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="text-center">
            {attempt.passed ? (
              <>
                <Award className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-green-900 dark:text-green-200 mb-2">
                  Congratulations! You Passed!
                </h2>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-red-900 dark:text-red-200 mb-2">
                  {attemptsExhausted ? 'All Attempts Used' : 'Keep Trying!'}
                </h2>
              </>
            )}
            <p className="text-7xl font-bold mb-4" style={{ 
              color: attempt.passed ? '#10b981' : '#ef4444' 
            }}>
              {attempt.score}%
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              {attempt.passed ? (
                `You scored above the passing score of ${test.passingScore}%`
              ) : attemptsExhausted ? (
                `You have used all ${test.maxAttempts} attempts for this test. Please contact your instructor if you need another attempt.`
              ) : (
                `You need ${test.passingScore}% to pass. You can try again!`
              )}
            </p>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {correctAnswers} / {totalQuestions}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Test Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attempt.pointsEarned} / {attempt.totalPoints}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(attempt.timeSpentSeconds)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed Results */}
        {test.showCorrectAnswers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Detailed Results
            </h2>

            <div className="space-y-6">
              {test.questions.map((question, qIndex) => {
                const answer = attempt.answers.find(a => a.questionId === question._id);
                const selectedOption = answer ? question.options[answer.selectedOptionIndex] : null;
                const correctOption = question.options.find(opt => opt.isCorrect);

                return (
                  <div key={question._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        answer?.isCorrect
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {answer?.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Question {qIndex + 1}: {question.questionText}
                        </h3>

                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => {
                            const isSelected = answer?.selectedOptionIndex === oIndex;
                            const isCorrect = option.isCorrect;

                            return (
                              <div
                                key={oIndex}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrect
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : isSelected && !isCorrect
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  {isCorrect && (
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  )}
                                  {isSelected && !isCorrect && (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                  )}
                                  <span className={`flex-1 ${
                                    isCorrect || (isSelected && !isCorrect)
                                      ? 'font-medium'
                                      : ''
                                  } ${
                                    isCorrect
                                      ? 'text-green-900 dark:text-green-200'
                                      : isSelected && !isCorrect
                                      ? 'text-red-900 dark:text-red-200'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {option.optionText}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Your answer
                                    </span>
                                  )}
                                  {isCorrect && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      Correct answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Points: {answer?.pointsEarned || 0} / {question.points}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Attempts Remaining */}
        {!attempt.passed && attempt.attemptNumber < test.maxAttempts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 mt-8"
          >
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                You have {test.maxAttempts - attempt.attemptNumber} attempt(s) remaining
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Review your answers and try again to improve your score!
              </p>
              <button
                onClick={() => navigate(`/student/test/${test._id}`)}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TestResults;
