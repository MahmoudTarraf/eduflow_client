import { useState, useCallback } from 'react';

/**
 * Custom hook to manage celebration animations
 * Tracks which celebrations have been shown to avoid duplicates
 * 
 * @returns {Object} celebration state and control functions
 */
const useCelebration = () => {
  const [celebrationState, setCelebrationState] = useState({
    isOpen: false,
    eventType: null,
    message: null,
    userName: null,
    courseName: null,
    userRole: 'student'
  });

  /**
   * Check if a celebration has already been shown
   * @param {string} eventKey - Unique key for the event (e.g., 'signup', 'course_completed_123')
   */
  const hasShownCelebration = useCallback((eventKey) => {
    try {
      const celebrations = JSON.parse(localStorage.getItem('celebrations') || '{}');
      return celebrations[eventKey] === true;
    } catch (error) {
      console.error('Error checking celebration status:', error);
      return false;
    }
  }, []);

  /**
   * Mark a celebration as shown
   * @param {string} eventKey - Unique key for the event
   */
  const markCelebrationShown = useCallback((eventKey) => {
    try {
      const celebrations = JSON.parse(localStorage.getItem('celebrations') || '{}');
      celebrations[eventKey] = true;
      localStorage.setItem('celebrations', JSON.stringify(celebrations));
    } catch (error) {
      console.error('Error marking celebration:', error);
    }
  }, []);

  /**
   * Trigger a celebration animation
   * @param {Object} config - Celebration configuration
   */
  const celebrate = useCallback(({
    eventType,
    message,
    userName,
    courseName,
    userRole = 'student',
    eventKey = null,
    skipDuplicateCheck = false
  }) => {
    // Check if this celebration should be shown
    if (!skipDuplicateCheck && eventKey && hasShownCelebration(eventKey)) {
      console.log(`Celebration already shown for: ${eventKey}`);
      return;
    }

    // Show the celebration
    setCelebrationState({
      isOpen: true,
      eventType,
      message,
      userName,
      courseName,
      userRole
    });

    // Mark as shown if eventKey provided
    if (eventKey) {
      markCelebrationShown(eventKey);
    }
  }, [hasShownCelebration, markCelebrationShown]);

  /**
   * Close the celebration modal
   */
  const closeCelebration = useCallback(() => {
    setCelebrationState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  /**
   * Reset celebration tracking (useful for testing or user preference)
   * @param {string} eventKey - Optional specific event to reset, or all if not provided
   */
  const resetCelebrations = useCallback((eventKey = null) => {
    try {
      if (eventKey) {
        const celebrations = JSON.parse(localStorage.getItem('celebrations') || '{}');
        delete celebrations[eventKey];
        localStorage.setItem('celebrations', JSON.stringify(celebrations));
      } else {
        localStorage.removeItem('celebrations');
      }
    } catch (error) {
      console.error('Error resetting celebrations:', error);
    }
  }, []);

  return {
    celebrationState,
    celebrate,
    closeCelebration,
    hasShownCelebration,
    resetCelebrations
  };
};

export default useCelebration;
