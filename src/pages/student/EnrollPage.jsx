import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/currency';

const EnrollPage = () => {
  const { id } = useParams(); // Route uses :id parameter
  const courseId = id; // Use id from params
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseAndGroups();
    }
  }, [courseId]);

  const fetchCourseAndGroups = async () => {
    try {
      setLoading(true);
      
      // Check if user is suspended and blocked from enrollment
      if (user?.status === 'suspended' && user?.restrictions?.enrollNewCourses) {
        toast.error('Your account is suspended. You cannot enroll in new courses.');
        navigate('/student');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Fetch course details
      const courseRes = await axios.get(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(courseRes.data.course);

      // Fetch available groups for this course
      const groupsRes = await axios.get(`/api/courses/${courseId}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(groupsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (user?.status === 'suspended' && user?.restrictions?.enrollNewCourses) {
      toast.error('Your account is suspended. You cannot enroll in new courses.');
      navigate('/student');
      return;
    }

    if (!selectedGroup) {
      toast.error('Please select a group');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/enroll', {
        courseId,
        groupId: selectedGroup
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Successfully enrolled in course!');
      // Redirect to course details page
      navigate(`/student/course/${courseId}/details`);
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in course';
      
      // If already enrolled, redirect to course details
      if (errorMessage.includes('already enrolled')) {
        toast.info('You are already enrolled in this course');
        navigate(`/student/course/${courseId}/details`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Enroll in {course?.name}
            </h1>
            {course?.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {course.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Enrolling in courses on EduFlow is free.
            </p>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please select a group to enroll in this course
            </p>

            {groups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No groups available for this course
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {groups.map((group) => (
                  <div 
                    key={group._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGroup === group._id 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                    }`}
                    onClick={() => setSelectedGroup(group._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {group.level} • {new Date(group.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to {new Date(group.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                          Instructor: {group.instructor?.name || 'Not assigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(
                            (group.course?.totalPriceCents) || 
                            ((group.course?.totalCostSYR || group.course?.totalPrice || group.course?.cost || 0) * 100) || 0,
                            group.course?.currency || 'SYP'
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {group.currentStudents}/{group.maxStudents} students
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={!selectedGroup || loading || (user?.status === 'suspended' && user?.restrictions?.enrollNewCourses)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Enroll in Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollPage;
