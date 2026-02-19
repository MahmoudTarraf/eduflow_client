import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import PaymentMethods from '../components/home/PaymentMethods';
import HeroSlider from '../components/home/HeroSlider';
import StatsSection from '../components/home/StatsSection';
import SearchFilters from '../components/home/SearchFilters';
import CoursesList from '../components/home/CoursesList';
import TestimonialsSection from '../components/home/TestimonialsSection';
import { homeTour } from '../config/tours';
import useFirstLogin from '../hooks/useFirstLogin';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isFirstLogin = useFirstLogin();
  
  // Fetch all data using custom hook
  const { courses, categories, featuredRatings, enrolledCourseIds, loading } = useHomeData(user);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Initialize AOS once
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    return () => AOS.refresh();
  }, []);

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

  // Memoized filtered courses
  const displayedCourses = useMemo(() => {
    if (hasSearched) {
      return searchResults;
    }

    // Filter approved courses only
    return courses.filter(course => 
      course.status === 'approved' && 
      course.isActive !== false
    );
  }, [courses, searchResults, hasSearched]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
        {/* Tour Guide for first-time users */}
        {isFirstLogin && <TourGuide steps={homeTour} />}

        {/* Hero Slider */}
        <HeroSlider onScrollToCourses={scrollToCourses} t={t} />

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
          showAllCourses={showAllCourses}
          onToggleShowAll={toggleShowAll}
          t={t}
        />

        {/* Testimonials */}
        <TestimonialsSection ratings={featuredRatings} t={t} />

        {/* Payment Methods */}
        <PaymentMethods />
      </div>
    </PageTransition>
  );
};

export default Home;
