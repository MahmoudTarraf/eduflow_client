import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { useAuth } from '../contexts/AuthContext';
import { useHomeData } from '../hooks/useHomeData';
import PageTransition from '../components/common/PageTransition';
import TourGuide from '../components/common/TourGuide';
import HeroSlider from '../components/home/HeroSlider';
import AnimatedFeatures from '../components/home/AnimatedFeatures';
import StatsSection from '../components/home/StatsSection';
import SearchFilters from '../components/home/SearchFilters';
import CoursesList from '../components/home/CoursesList';
import { getHomeTour } from '../config/tours';
import useFirstLogin from '../hooks/useFirstLogin';
import TestimonialsSection from '../components/home/TestimonialsSection';
import PaymentMethods from '../components/home/PaymentMethods';


const Home = () => {
  const { t } = useTranslation();
  const { user, weakPassword } = useAuth();
  const location = useLocation();
  const isFirstLogin = useFirstLogin();
  
  // Fetch all data using custom hook
  const { courses, categories, featuredRatings, enrolledCourseIds, loading, refetch } = useHomeData(user);
  const [showHomepageRatings, setShowHomepageRatings] = useState(true);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [levels, setLevels] = useState([]);
  const [pendingFilterFromUrl, setPendingFilterFromUrl] = useState(false);

  // Initialize AOS once
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    return () => AOS.refresh();
  }, []);

  // Fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get('/api/levels');
        setLevels(response.data.levels || []);
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };
    fetchLevels();
  }, []);

  // Fetch public admin settings to know whether to show homepage ratings
  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data && res.data.success && res.data.data) {
          setShowHomepageRatings(res.data.data.showHomepageRatings !== false);
        }
      } catch (e) {
        // On error, keep default (true) so homepage continues to show ratings
      }
    };

    loadPublicSettings();
  }, []);

  // Refresh courses on global updates (e.g., instructor edits course details)
  useEffect(() => {
    if (!refetch || !refetch.courses) return;
    const handler = () => {
      refetch.courses();
    };
    window.addEventListener('courses:updated', handler);
    return () => window.removeEventListener('courses:updated', handler);
  }, [refetch]);

  // Scroll to courses section
  const scrollToCourses = useCallback((e) => {
    e.preventDefault();
    const coursesSection = document.getElementById('courses');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchTerm && !selectedCategory && !selectedLevel) {
      return;
    }

    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedLevel) params.append('level', selectedLevel);
      
      const url = `/api/courses/search?${params.toString()}`;
      const response = await axios.get(url);
      
      setSearchResults(response.data.courses || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchTerm, selectedCategory, selectedLevel]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setHasSearched(false);
    setSearchResults([]);
  }, []);

  // Toggle show all courses
  const toggleShowAll = useCallback(() => {
    setShowAllCourses(prev => !prev);
  }, []);

  // Apply filters from URL query params (category, level, q) once and then trigger search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromUrl = params.get('category') || '';
    const levelFromUrl = params.get('level') || '';
    const qFromUrl = params.get('q') || '';

    if (categoryFromUrl || levelFromUrl || qFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setSelectedLevel(levelFromUrl);
      setSearchTerm(qFromUrl);
      setHasSearched(false);
      setPendingFilterFromUrl(true);
    }
  }, [location.search]);

  // Once state is updated from URL filters, trigger a search and scroll to courses
  useEffect(() => {
    if (!pendingFilterFromUrl) return;

    const run = async () => {
      await handleSearch();
      const coursesSection = document.getElementById('courses');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setPendingFilterFromUrl(false);
    };

    run();
  }, [pendingFilterFromUrl, handleSearch]);

  // Memoized filtered courses
  const displayedCourses = useMemo(() => {
    if (hasSearched) {
      return searchResults;
    }

    // Return all courses (API already filters approved courses)
    return courses;
  }, [courses, searchResults, hasSearched]);

  return (
    <PageTransition>
      <div className="min-h-screen">
        {weakPassword && (user?.role === 'admin' || user?.role === 'instructor') && (
          <div className="border-b border-yellow-100 dark:border-yellow-900/40 bg-yellow-50/60 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200 px-4 py-2 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <span>
                Your password is considered weak. For better security, please update it from your account settings.
              </span>
            </div>
            <a
              href="/profile"
              className="ml-4 inline-flex items-center px-3 py-1.5 rounded-md bg-yellow-600 text-white text-xs font-medium hover:bg-yellow-700"
            >
              Update
            </a>
          </div>
        )}
        {/* Tour Guide */}
        <TourGuide steps={getHomeTour(t)} tourKey="home" showButton={true} />

        {/* Hero Slider */}
        <HeroSlider onScrollToCourses={scrollToCourses} user={user} t={t} />

        {/* Animated Features Showcase */}
        <AnimatedFeatures t={t} />

        {/* Stats Section */}
        <StatsSection t={t} />

        {/* Search Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedLevel={selectedLevel}
          setSelectedLevel={setSelectedLevel}
          hasSearched={hasSearched}
          categories={categories}
          levels={levels}
          searching={searching}
          onSearch={handleSearch}
          onClearSearch={clearSearch}
          t={t}
        />

        {/* Courses List */}
        <CoursesList
          courses={displayedCourses}
          loading={loading || searching}
          hasSearched={hasSearched}
          enrolledCourseIds={enrolledCourseIds}
          user={user}
          showAllCourses={showAllCourses}
          onToggleShowAll={toggleShowAll}
          t={t}
        />

        {/* Testimonials (student ratings slider) */}
        {showHomepageRatings && featuredRatings && featuredRatings.length > 0 && (
          <TestimonialsSection ratings={featuredRatings} t={t} />
        )}

        {/* Payment Methods */}
        <PaymentMethods />
      </div>
    </PageTransition>
  );
};

export default Home;
