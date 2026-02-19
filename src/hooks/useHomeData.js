import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useHomeData = (user) => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRatings, setFeaturedRatings] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple localStorage cache with TTL
  const getCache = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  };

  const setCache = (key, data, ttlMs = 10 * 60 * 1000) => {
    try {
      localStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + ttlMs }));
    } catch {}
  };

  const fetchCourses = useCallback(async () => {
    try {
      // Always fetch fresh courses so archived/unarchived state is accurate
      const response = await axios.get('/api/courses');
      const list = response.data.courses || [];
      setCourses(list);
      setError(null);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
      setCourses([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cacheKey = 'home_categories_v1';
      const cached = getCache(cacheKey);
      if (cached) {
        setCategories(cached);
      } else {
        const response = await axios.get('/api/categories');
        const list = response.data.categories || [];
        setCategories(list);
        setCache(cacheKey, list);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  const fetchFeaturedRatings = useCallback(async () => {
    try {
      const response = await axios.get('/api/ratings/featured');
      const list = response.data.ratings || [];
      setFeaturedRatings(list);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setFeaturedRatings([]);
    }
  }, []);

  const fetchEnrolledCourses = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setEnrolledCourseIds([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setEnrolledCourseIds([]);
        return;
      }
      
      const response = await axios.get('/api/courses/enrolled', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const enrollments = response.data.enrolledCourses || [];
      
      const courseIds = enrollments
        .map(enrollment => {
          if (enrollment.course) {
            const courseId = typeof enrollment.course === 'object' 
              ? enrollment.course._id 
              : enrollment.course;
            return String(courseId);
          }
          return null;
        })
        .filter(Boolean);
      
      setEnrolledCourseIds(courseIds);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setEnrolledCourseIds([]);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCourses(),
        fetchCategories(),
        fetchFeaturedRatings(),
        fetchEnrolledCourses()
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchCourses, fetchCategories, fetchFeaturedRatings, fetchEnrolledCourses]);

  return {
    courses,
    categories,
    featuredRatings,
    enrolledCourseIds,
    loading,
    error,
    refetch: {
      courses: fetchCourses,
      categories: fetchCategories,
      ratings: fetchFeaturedRatings,
      enrollments: fetchEnrolledCourses
    }
  };
};
