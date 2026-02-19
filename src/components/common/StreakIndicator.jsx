import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StreakFlameIcon from '../icons/StreakFlameIcon';

const StreakIndicator = ({ 
  streak = 0, 
  compact = false, 
  showLabel = false,
  className = '',
  onClick = null,
  animated = false
}) => {
  const [displayStreak, setDisplayStreak] = useState(streak);
  const [isUpdating, setIsUpdating] = useState(false);

  // Animate streak number changes
  useEffect(() => {
    if (streak !== displayStreak) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setDisplayStreak(streak);
        setIsUpdating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [streak, displayStreak]);

  const getStreakColor = () => {
    if (streak === 0) return 'text-gray-400 dark:text-gray-500';
    if (streak >= 30) return 'text-purple-600 dark:text-purple-400';
    if (streak >= 14) return 'text-blue-600 dark:text-blue-400';
    if (streak >= 7) return 'text-green-600 dark:text-green-400';
    if (streak >= 3) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStreakMessage = () => {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return 'Great start!';
    if (streak >= 30) return 'Legendary streak! 🏆';
    if (streak >= 14) return 'Amazing dedication! ⭐';
    if (streak >= 7) return 'One week strong! 💪';
    if (streak >= 3) return 'Building momentum! 🔥';
    return 'Keep it up! 🚀';
  };

  if (compact) {
    return (
      <div 
        className={`flex items-center space-x-1 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={onClick}
        title={`${streak} day${streak !== 1 ? 's' : ''} streak - ${getStreakMessage()}`}
      >
        <StreakFlameIcon 
          className="w-5 h-5" 
          animated={animated || isUpdating}
          glowing={streak >= 7}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={displayStreak}
            initial={{ opacity: 0, scale: 0.8, y: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: 2 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-bold ${getStreakColor()}`}
          >
            {displayStreak}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-1 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`} onClick={onClick}>
      <StreakFlameIcon 
        className="w-8 h-8" 
        animated={animated || isUpdating}
        glowing={streak >= 7}
      />
      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={displayStreak}
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: 4 }}
            transition={{ duration: 0.3 }}
            className={`text-lg font-bold ${getStreakColor()}`}
          >
            {displayStreak}
          </motion.span>
        </AnimatePresence>
        {showLabel && (
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {streak === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>
    </div>
  );
};

export default StreakIndicator;
