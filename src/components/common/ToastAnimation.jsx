import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StreakFlameIcon from '../icons/StreakFlameIcon';

const ToastAnimation = ({ 
  type = 'welcome',           // 'welcome' | 'streak' | 'gamification'
  subtype = '',               // 'pointsAwarded' | 'badgeUnlocked' | 'titleUp'
  message = '',
  streak = 0,
  userName = '',
  courseName = '',
  visible = false,
  onClose = () => {},
  duration = 3000,            // Auto-dismiss after 3 seconds
  position = 'top-right',     // 'top-right' | 'top-left'
  className = ''
}) => {
  const { i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(visible);
  
  // Check if current language is RTL
  const isRTL = i18n.language === 'ar' || i18n.language === 'he' || i18n.language === 'fa';

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for exit animation
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimationVariants = () => {
    const isRTL = position === 'top-left';
    
    return {
      initial: {
        opacity: 0,
        y: -50,
        x: isRTL ? -50 : 50,
        scale: 0.8
      },
      animate: {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20,
          duration: 0.4
        }
      },
      exit: {
        opacity: 0,
        y: -30,
        x: isRTL ? -30 : 30,
        scale: 0.9,
        transition: {
          duration: 0.3
        }
      }
    };
  };

  const getGamificationIcon = () => {
    switch (subtype) {
      case 'pointsAwarded':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-lg font-bold">⚡</span>
          </div>
        );
      case 'badgeUnlocked':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-lg">🏅</span>
          </div>
        );
      case 'titleUp':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-lg">👑</span>
          </div>
        );
      case 'videoCompleted':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">📺</span>
          </div>
        );
      case 'lessonCompleted':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">📚</span>
          </div>
        );
      case 'assignmentSubmitted':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">📝</span>
          </div>
        );
      case 'projectSubmitted':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🚀</span>
          </div>
        );
      case 'testCompleted':
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🧪</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🎉</span>
          </div>
        );
    }
  };

  const renderToastContent = () => {
    if (type === 'streak') {
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <StreakFlameIcon 
              className="w-10 h-10" 
              animated={true}
              glowing={streak >= 7}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streak}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {streak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate">
              {message || `${streak}-day streak!`}
            </p>
          </div>
        </div>
      );
    }

    if (type === 'gamification') {
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getGamificationIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
              {message}
            </p>
            {(userName || courseName) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userName && courseName ? `${userName} • ${courseName}` : userName || courseName}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Welcome type
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">👋</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
            {message || "Let's continue learning!"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-[9999] ${getPositionClasses()} ${className}`}
          variants={getAnimationVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-4 max-w-xs w-full backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 ring-1 ring-black/5 dark:ring-white/10 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
              aria-label="Close notification"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Toast content */}
            <div className="pr-6">
              {renderToastContent()}
            </div>

            {/* Progress bar for auto-dismiss */}
            {duration > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-lg"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastAnimation;
