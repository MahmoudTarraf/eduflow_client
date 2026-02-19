import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  GraduationCap,
  Users,
  BookOpen,
  Linkedin,
  Github,
  Twitter,
  Globe,
  Mail
} from 'lucide-react';

const Instructors = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/instructors/public');
      setInstructors(res.data.instructors || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.expertise?.some((exp) =>
      exp.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('meetOurInstructors')}
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              {t('expertInstructorsTeam')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder={t('searchHelp') || 'Search instructors...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        )}

        {/* Instructors Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInstructors.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No instructors found
                </p>
              </div>
            ) : (
              filteredInstructors.map((instructor, index) => (
                <motion.div
                  key={instructor._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-6">
                  

                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                        {instructor.avatar ? (
                          <img
                            src={instructor.avatar}
                            alt={instructor.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {instructor.name?.charAt(0)?.toUpperCase() || 'I'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                      {instructor.name}
                    </h3>

                    {/* About Me / Bio */}
                    {(instructor.aboutMeHtml || instructor.aboutMe || instructor.bio) && (
                      <div
                        className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: instructor.aboutMeHtml || instructor.aboutMe || instructor.bio }}
                      />
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-200 dark:border-gray-700">
                      <div className="text-center">
                        <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
                          <BookOpen className="w-4 h-4 mr-1" />
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {instructor.courseCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Courses
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
                          <Users className="w-4 h-4 mr-1" />
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {instructor.studentCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Students
                        </p>
                      </div>
                    </div>

                    {/* Expertise Tags */}
                    {instructor.expertise && instructor.expertise.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {instructor.expertise.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {instructor.expertise.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              +{instructor.expertise.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Links + Email */}
                    {((instructor.socialLinks &&
                      Object.values(instructor.socialLinks).some((link) => link)) ||
                      instructor.email) && (
                      <div className="flex justify-center gap-3 mb-4">
                        {instructor.socialLinks?.linkedin && (
                          <a
                            href={instructor.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                        {instructor.socialLinks?.github && (
                          <a
                            href={instructor.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                          >
                            <Github className="w-5 h-5" />
                          </a>
                        )}
                        {instructor.socialLinks?.twitter && (
                          <a
                            href={instructor.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                          >
                            <Twitter className="w-5 h-5" />
                          </a>
                        )}
                        {instructor.socialLinks?.website && (
                          <a
                            href={instructor.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                          >
                            <Globe className="w-5 h-5" />
                          </a>
                        )}
                        {instructor.email && (
                          <a
                            href={`mailto:${instructor.email}`}
                            className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
                            title={t('sendEmail') || 'Send email'}
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* View Profile Button */}
                    <button
                      onClick={() => navigate(`/instructor/${instructor._id}`)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    >
                      {t('viewProfile')}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Instructors;