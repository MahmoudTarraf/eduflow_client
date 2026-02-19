import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { formatPrice } from '../../utils/currency';

const StudentGroupSections = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const targetLectureId = searchParams.get('lecture');

  useEffect(() => {
    fetchGroupAndSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchGroupAndSections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch group details
      const groupRes = await axios.get(
        `/api/groups/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(groupRes.data.group);

      // Fetch sections
      const sectionsRes = await axios.get(
        `/api/sections/group/${groupId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Check access for each section
      const sectionsWithAccess = await Promise.all(
        (sectionsRes.data.data || []).map(async (section) => {
          try {
            const accessRes = await axios.get(
              `/api/sections/${section._id}/access`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...section, access: accessRes.data };
          } catch (error) {
            return { ...section, access: { hasAccess: false, reason: 'error' } };
          }
        })
      );

      setSections(sectionsWithAccess);

      // Note: Removed automatic navigation to section content
      // Students should access content through course details page

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(error.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleViewContent = (sectionId) => {
    // Redirect to course details page instead
    if (group?.course?._id) {
      navigate(`/student/course/${group.course._id}/details`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{group?.name} - Course Sections</h1>
          <p className="mt-2 text-gray-600">
            Course: {group?.course?.name}
          </p>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg shadow">
              <p className="text-gray-500 text-lg">No sections available yet.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900">{section.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          section.isFree 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {section.isFree ? '✅ Free' : `💰 ${formatPrice(section.priceCents || 0, section.currency || 'SYR')}`}
                        </span>
                        {section.access?.hasAccess && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔓 Unlocked
                          </span>
                        )}
                      </div>
                      {section.description && (
                        <p className="mt-2 text-gray-600">{section.description}</p>
                      )}
                      <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                        <span>📹 {section.contentCounts?.lectures || 0} Lectures</span>
                        <span>📝 {section.contentCounts?.assignments || 0} Assignments</span>
                        <span>🚀 {section.contentCounts?.projects || 0} Projects</span>
                      </div>
                    </div>

                    <div className="ml-4">
                      {section.access?.hasAccess ? (
                        <button
                          onClick={() => handleViewContent(section._id)}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Start Learning
                        </button>
                      ) : (
                        <div className="text-center">
                          {section.access?.reason === 'payment_required' ? (
                            <>
                              <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                🔒 Locked
                              </div>
                              <p className="mt-2 text-sm text-red-600 font-medium">
                                Payment Required: {formatPrice(section.priceCents || 0, section.currency || 'SYR')}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Contact instructor to unlock
                              </p>
                            </>
                          ) : section.access?.reason === 'not_enrolled' ? (
                            <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed">
                              Not Enrolled
                            </div>
                          ) : (
                            <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed">
                              Access Denied
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGroupSections;
