import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Clock, 
  Users, 
  Star, 
  ArrowRight,
  BookOpen,
  Code,
  Globe,
  Award,
  TrendingUp,
  Target,
  Shield,
  Quote,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import AOS from 'aos';

import { useAuth } from '../contexts/AuthContext';
import PaymentMethods from '../components/home/PaymentMethods';
import PageTransition from '../components/common/PageTransition';
import NoDataIllustration from '../components/common/NoDataIllustration';
import TourGuide from '../components/common/TourGuide';
import CoursePrice from '../components/common/CoursePrice';
import { homeTour } from '../config/tours';
import useFirstLogin from '../hooks/useFirstLogin';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isFirstLogin = useFirstLogin();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [featuredRatings, setFeaturedRatings] = useState([]);
  const [categories, setCategories] = useState([]);

  const scrollToCourses = (e) => {
    e.preventDefault();
    const coursesSection = document.getElementById('courses');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    fetchCourses();
    fetchCategories();
    fetchFeaturedRatings();
    if (user?.role === 'student') {
      fetchEnrolledCourses();
    }
    AOS.refresh();
  }, [user]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedRatings = async () => {
    try {
      // Fetch ratings with 4-5 stars to display as testimonials
      const response = await axios.get('/api/ratings/featured');
      setFeaturedRatings(response.data.ratings || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, skipping enrollment fetch');
        return;
      }
      
      // Fetch enrollments from courses endpoint
      const enrollmentResponse = await axios.get('/api/courses/enrolled', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const enrollments = enrollmentResponse.data.enrolledCourses || [];
      console.log('[Home] Raw enrollments from API:', enrollments.length, 'enrollments');
      
      const courseIds = enrollments.map(enrollment => {
        // Extract course ID from enrollment - ensure it's a string
        let courseId = null;
        if (enrollment.course) {
          if (typeof enrollment.course === 'object' && enrollment.course !== null) {
            courseId = enrollment.course._id;
          } else {
            courseId = enrollment.course;
          }
          // Convert to string for consistent comparison
          courseId = String(courseId);
        }
        console.log('[Home] Extracted course ID:', courseId, 'from enrollment status:', enrollment.status);
        return courseId;
      }).filter(Boolean);
      
      console.log('[Home] Final enrolled course IDs:', courseIds);
      setEnrolledCourseIds(courseIds);
    } catch (error) {
      console.error('[Home] Error fetching enrolled courses:', error.response?.data || error.message);
      setEnrolledCourseIds([]); // Reset to empty array on error
    }
  };

  const isEnrolled = (courseId) => {
    if (!courseId) return false;
    
    // Convert course ID to string for consistent comparison
    const courseIdStr = String(courseId);
    
    // Check if this course ID is in the enrolled list
    const enrolled = enrolledCourseIds.includes(courseIdStr);
    
    console.log(`[Home] Checking enrollment for course ${courseIdStr}:`, {
      enrolled,
      totalEnrolled: enrolledCourseIds.length,
      enrolledIds: enrolledCourseIds
    });
    
    return enrolled;
  };

  const executeSearch = async () => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel) params.append('level', selectedLevel);
      const url = params.toString() ? `/api/courses/search?${params.toString()}` : '/api/courses';
      const response = await axios.get(url);
      setSearchResults(response.data.courses);
      setHasSearched(!!params.toString());
      setShowAllCourses(false);
    } catch (error) {
      console.error('Search courses error:', error);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setHasSearched(false);
    setSearchResults([]);
    setShowAllCourses(false);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'programming':
        return <Code className="w-6 h-6" />;
      case 'language':
        return <Globe className="w-6 h-6" />;
      default:
        return <BookOpen className="w-6 h-6" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
      case 'A1':
      case 'A2':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
      case 'B1':
      case 'B2':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
      case 'C1':
      case 'C2':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero Slider Section */}
        <section className="hero-section relative h-[600px] md:h-[700px] overflow-hidden">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectFade]}
            effect="fade"
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            className="h-full"
          >
            {/* Slide 1 */}
            <SwiperSlide>
              <div className="relative h-full w-full">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1920&auto=format&fit=crop'), linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                  }}
                  onError={(e) => {
                    e.target.style.backgroundImage = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                  }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 0.2 }}
                    >
                      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        {t('welcomeTitle')}
                      </h1>
                      <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                        {t('welcomeSubtitle')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {user ? (
                          <Link
                            to={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student'}
                            className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                          >
                            {t('dashboard')}
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/register"
                              className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                            >
                              {t('getStarted')}
                            </Link>
                            <a
                              href="#courses"
                              onClick={scrollToCourses}
                              className="btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4 backdrop-blur-sm cursor-pointer"
                            >
                              {t('exploreCourses')}
                            </a>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* Slide 2 */}
            <SwiperSlide>
              <div className="relative h-full w-full">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&auto=format&fit=crop'), linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" 
                  }}
                  onError={(e) => {
                    e.target.style.backgroundImage = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
                  }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1 }}
                    >
                      <Award className="w-20 h-20 mx-auto mb-6 text-white" />
                      <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        {t('learnFromExperts')}
                      </h2>
                      <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                        {t('masterNewSkillsWithIndustryLeading')}
                      </p>
                      <a
                        href="#courses"
                        onClick={scrollToCourses}
                        className="btn-primary bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span>{t('viewCourses')}</span>
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            {/* Slide 3 */}
            <SwiperSlide>
              <div className="relative h-full w-full">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1920&auto=format&fit=crop'), linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" 
                  }}
                  onError={(e) => {
                    e.target.style.backgroundImage = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
                  }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative h-full flex items-center justify-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 1 }}
                    >
                      <Zap className="w-20 h-20 mx-auto mb-6 text-white" />
                      <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        {t('advanceYourCareer')}
                      </h2>
                      <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
                        {t('gainInDemandSkillsAndCertificates')}
                      </p>
                      {user ? (
                        <a
                          href="#courses"
                          onClick={scrollToCourses}
                          className="btn-primary bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl inline-flex items-center gap-2 cursor-pointer"
                        >
                          <span>{t('exploreCourses')}</span>
                          <ArrowRight className="w-5 h-5" />
                        </a>
                      ) : (
                        <Link
                          to="/register"
                          className="btn-primary bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl inline-flex items-center gap-2"
                        >
                          <span>{t('startLearningToday')}</span>
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <Users className="w-8 h-8" />, number: '10,000+', label: t('studentsCount') },
                { icon: <BookOpen className="w-8 h-8" />, number: '50+', label: t('coursesCount') },
                { icon: <Award className="w-8 h-8" />, number: '100+', label: t('instructorsCount') },
                { icon: <TrendingUp className="w-8 h-8" />, number: '95%', label: t('successRate') }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Search Filters */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900" data-aos="fade-up">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('searchCoursesPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field md:w-48"
              >
                <option value="">{t('category')}</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input-field md:w-48"
              >
                <option value="">{t('level')}</option>
                <option value="beginner">{t('beginner')}</option>
                <option value="intermediate">{t('intermediate')}</option>
                <option value="advanced">{t('advanced')}</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
              <button onClick={executeSearch} className="btn-primary whitespace-nowrap px-6">
                {searching ? t('loading') || 'Searching...' : t('search')}
              </button>
              {hasSearched && (
                <button onClick={clearSearch} className="btn-secondary whitespace-nowrap px-6">
                  {t('allCourses')}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {hasSearched ? 'Search Results' : t('recentCourses')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t('discoverMostPopularCourses')}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (hasSearched ? searchResults : filteredCourses).length === 0 ? (
              <div className="card">
                <NoDataIllustration message={hasSearched ? 'No courses' : 'No courses available'} />
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(hasSearched ? searchResults : filteredCourses).slice(0, showAllCourses ? undefined : 12).map((course, index) => (
                  <motion.div
                    key={course._id}
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="card hover:shadow-2xl transition-all duration-300 group"
                  >
                    {/* Course Image */}
                    <div className="relative mb-4 overflow-hidden rounded-lg">
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        {course.image ? (
                          <img
                            src={course.image}
                            alt={course.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<svg class="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>';
                            }}
                          />
                        ) : (
                          <BookOpen className="w-16 h-16 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {course.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">4.8</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {course.name}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration} {t('weeks')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{course.groups?.length || 0} groups</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                        <div className="mb-3">
                          <CoursePrice course={course} showTimer={true} />
                        </div>
                        {user?.role === 'student' && isEnrolled(course._id) ? (
                          <Link
                            to={`/student/course/${course._id}/details`}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <span>{t('continueCourse')}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        ) : user?.role === 'student' ? (
                          <Link
                            to={`/student/course/${course._id}/enroll`}
                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <span>{t('registerForCourse')}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        ) : (
                          <Link
                            to={`/courses/${course._id}`}
                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <span>{t('viewDetails')}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Show All Button */}
              {!showAllCourses && (hasSearched ? searchResults : filteredCourses).length > 12 && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => setShowAllCourses(true)}
                    className="btn-outline text-lg px-8 py-3"
                  >
                    {t('showMore') || 'Show All'} ({(hasSearched ? searchResults : filteredCourses).length} {t('courses')})
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="about" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('whyChooseEduFlowAcademy')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t('experienceBestOnlineEducation')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Award className="w-10 h-10" />,
                  title: t('expertInstructorsCard'),
                  description: t('expertInstructorsCardDesc'),
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: <Target className="w-10 h-10" />,
                  title: t('flexibleSchedule'),
                  description: t('flexibleScheduleDesc'),
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  icon: <Shield className="w-10 h-10" />,
                  title: t('certifiedLearning'),
                  description: t('certifiedLearningDesc'),
                  color: 'from-orange-500 to-red-500'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  whileHover={{ scale: 1.05 }}
                  className="relative p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16" data-aos="fade-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('whatOurStudentsSay')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t('realSuccessStories')}
              </p>
            </div>

            {featuredRatings.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                breakpoints={{
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 }
                }}
                className="pb-12"
              >
                {featuredRatings.map((rating, index) => (
                  <SwiperSlide key={rating._id || index}>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 h-full shadow-lg hover:shadow-xl transition-shadow">
                      <Quote className="w-10 h-10 text-primary-400 mb-4" />
                      <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg italic">
                        "{rating.review}"
                      </p>
                      {rating.course && (
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-4">
                          Course: {rating.course.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(rating.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        {rating.student?.avatar ? (
                          <img
                            src={`${axios.defaults.baseURL || 'http://localhost:5000'}${rating.student.avatar}`}
                            alt={rating.student.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                              {rating.student?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{rating.student?.name || 'Anonymous'}</div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">{rating.student?.jobRole || 'Learner'}</div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="text-center py-12">
                <Quote className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section - Only show for non-logged-in users */}
        {!user && (
          <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white" data-aos="fade-up">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('readyToStartLearningJourney')}
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                {t('joinThousandsOfStudents')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="btn-primary bg-white text-primary-600 hover:bg-gray-100 text-lg px-10 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  {t('getStartedFree')}
                </Link>
                <Link
                  to="#courses"
                  className="btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-10 py-4"
                >
                  {t('browseCourses')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Payment Methods Section */}
        <div data-aos="fade-up">
          <PaymentMethods />
        </div>
      </div>
      
      {/* Tour Guide */}
      <TourGuide 
        steps={homeTour} 
        tourKey="home" 
        autoStart={isFirstLogin}
        showButton={true}
      />
    </PageTransition>
  );
};

export default Home;
