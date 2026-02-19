import React, { useState, useEffect, useCallback } from 'react';
import ToastAnimation from './ToastAnimation';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  // Listen for custom toast events
  useEffect(() => {
    const handleToastEvent = (event) => {
      const { type, message, streak, duration, position } = event.detail;
      showToast({ type, message, streak, duration, position });
    };

    const handleGamificationEvent = (event) => {
      const { eventType, message, userName, courseName } = event.detail;
      
      // Only show toast for individual activities, not course completion
      if (eventType === 'courseCompleted') {
        console.log('🚫 TOAST: Skipping course completion - will be handled by modal');
        return;
      }
      
      // Check for recent gamification toast to prevent duplicates
      const recentGamificationKey = `recent_gamification_${eventType}`;
      const lastShown = sessionStorage.getItem(recentGamificationKey);
      const now = Date.now();
      
      // If shown within last 5 seconds, skip
      if (lastShown && (now - parseInt(lastShown)) < 5000) {
        console.log('🚫 TOAST: Skipping duplicate gamification toast', eventType);
        return;
      }
      
      sessionStorage.setItem(recentGamificationKey, now.toString());
      
      showToast({
        type: 'gamification',
        subtype: eventType,
        message: message,
        userName: userName,
        courseName: courseName,
        duration: 4000,
        position: getToastPosition()
      });
      
      // Clear the key after 10 seconds
      setTimeout(() => {
        sessionStorage.removeItem(recentGamificationKey);
      }, 10000);
    };

    const handleWelcomeEvent = (event) => {
      // Check for recent welcome toast to prevent duplicates
      const recentWelcomeKey = 'recent_welcome_toast';
      const lastShown = sessionStorage.getItem(recentWelcomeKey);
      const now = Date.now();
      
      // If shown within last 10 seconds, skip
      if (lastShown && (now - parseInt(lastShown)) < 10000) {
        console.log('🚫 TOAST: Skipping duplicate welcome toast');
        return;
      }
      
      sessionStorage.setItem(recentWelcomeKey, now.toString());
      
      showToast({
        type: 'welcome',
        message: event.detail?.message || "Let's continue learning! 🎓",
        duration: 3000,
        position: getToastPosition()
      });
      
      // Clear the key after 15 seconds
      setTimeout(() => {
        sessionStorage.removeItem(recentWelcomeKey);
      }, 15000);
    };

    const handleStreakEvent = (event) => {
      const { streakDays, streakMessage, isStreakUpdate } = event.detail;
      
      // Check for recent streak toast to prevent duplicates
      const recentStreakKey = `recent_streak_toast_${streakDays}`;
      const lastShown = sessionStorage.getItem(recentStreakKey);
      const now = Date.now();
      
      // If shown within last 30 seconds, skip
      if (lastShown && (now - parseInt(lastShown)) < 30000) {
        console.log('🚫 TOAST: Skipping duplicate streak toast');
        return;
      }
      
      // Only show toast if it's a streak update or first login
      if (isStreakUpdate || streakDays === 1) {
        sessionStorage.setItem(recentStreakKey, now.toString());
        
        showToast({
          type: 'streak',
          message: streakMessage,
          streak: streakDays,
          duration: 4000,
          position: getToastPosition()
        });
        
        // Clear the key after 60 seconds
        setTimeout(() => {
          sessionStorage.removeItem(recentStreakKey);
        }, 60000);
      }
    };

    // Listen for custom events
    window.addEventListener('show-toast', handleToastEvent);
    window.addEventListener('show-welcome-toast', handleWelcomeEvent);
    window.addEventListener('show-streak-toast', handleStreakEvent);
    window.addEventListener('show-gamification-toast', handleGamificationEvent);

    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
      window.removeEventListener('show-welcome-toast', handleWelcomeEvent);
      window.removeEventListener('show-streak-toast', handleStreakEvent);
      window.removeEventListener('show-gamification-toast', handleGamificationEvent);
    };
  }, []);

  const getToastPosition = () => {
    // Check if RTL language
    const isRTL = document.documentElement.dir === 'rtl' || 
                  document.documentElement.lang === 'ar' || 
                  document.documentElement.lang === 'he' ||
                  document.body.classList.contains('rtl');
    
    return isRTL ? 'top-left' : 'top-right';
  };

  const showToast = useCallback(({ type, message, streak, duration = 3000, position, subtype, userName, courseName }) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type,
      subtype,
      message,
      streak,
      userName,
      courseName,
      duration,
      position: position || getToastPosition(),
      visible: true
    };

    setToasts(prev => {
      // Remove any existing toast of the same type to prevent duplicates
      const filtered = prev.filter(toast => toast.type !== type);
      return [...filtered, newToast];
    });
  }, []);

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <div className="toast-manager">
      {toasts.map((toast, index) => (
        <ToastAnimation
          key={toast.id}
          type={toast.type}
          subtype={toast.subtype}
          message={toast.message}
          streak={toast.streak}
          userName={toast.userName}
          courseName={toast.courseName}
          visible={toast.visible}
          duration={toast.duration}
          position={toast.position}
          onClose={() => closeToast(toast.id)}
          className={index > 0 ? `mt-${(index) * 20}` : ''}
        />
      ))}
    </div>
  );
};

// Utility functions to trigger toasts from anywhere in the app
export const showWelcomeToast = (message = "Let's continue learning! 🎓") => {
  window.dispatchEvent(new CustomEvent('show-welcome-toast', {
    detail: { message }
  }));
};

export const showStreakToast = (streakDays, streakMessage, isStreakUpdate = false) => {
  window.dispatchEvent(new CustomEvent('show-streak-toast', {
    detail: { streakDays, streakMessage, isStreakUpdate }
  }));
};

export const showCustomToast = (type, message, options = {}) => {
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: { type, message, ...options }
  }));
};

export const showGamificationToast = (eventType, message, options = {}) => {
  window.dispatchEvent(new CustomEvent('show-gamification-toast', {
    detail: { eventType, message, ...options }
  }));
};

export default ToastManager;
