import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, BookOpen, GraduationCap, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

const CelebrationModal = ({ 
  isOpen, 
  onClose, 
  userRole = 'student',
  eventType,
  message,
  userName,
  courseName,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Trigger confetti
      triggerConfetti(eventType);
      
      // Auto-close after delay
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay]);

  const triggerConfetti = (type) => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Different confetti patterns for different events
      if (type === 'certificateReceived' || type === 'courseCompleted') {
        // Gold confetti for major achievements
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
      } else {
        // Colorful confetti for other events
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
        });
      }
    }, 250);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getEventConfig = () => {
    const configs = {
      signup: {
        icon: Sparkles,
        title: `Welcome${userName ? `, ${userName}` : ''}!`,
        subtitle: userRole === 'student' 
          ? "Let's start your learning journey 🎓" 
          : "Your teaching journey begins 👨‍🏫",
        gradient: 'from-blue-500 to-purple-600',
        iconColor: 'text-blue-500'
      },
      courseCompleted: {
        icon: Trophy,
        title: 'Course Completed! 🏆',
        subtitle: courseName 
          ? `You've successfully completed ${courseName}` 
          : 'Amazing achievement!',
        gradient: 'from-green-500 to-emerald-600',
        iconColor: 'text-green-500'
      },
      certificateReceived: {
        icon: GraduationCap,
        title: 'Certificate Earned! 🎓',
        subtitle: courseName 
          ? `Your certificate for ${courseName} is ready` 
          : 'Amazing job!',
        gradient: 'from-yellow-500 to-orange-600',
        iconColor: 'text-yellow-500'
      },
      courseCreated: {
        icon: BookOpen,
        title: 'Course Created! 🚀',
        subtitle: courseName 
          ? `${courseName} is now live!` 
          : "Let's inspire students!",
        gradient: 'from-indigo-500 to-purple-600',
        iconColor: 'text-indigo-500'
      },
      assignmentCompleted: {
        icon: Award,
        title: 'Assignment Completed! ✨',
        subtitle: 'Great work on completing your assignment!',
        gradient: 'from-pink-500 to-rose-600',
        iconColor: 'text-pink-500'
      },
      pointsAwarded: {
        icon: Trophy,
        title: 'Points Awarded! ✨',
        subtitle: message || 'Keep going to earn more points!',
        gradient: 'from-green-500 to-teal-600',
        iconColor: 'text-green-500'
      },
      badgeUnlocked: {
        icon: Award,
        title: 'Badge Unlocked! 🏅',
        subtitle: message || 'New achievement unlocked',
        gradient: 'from-amber-500 to-yellow-600',
        iconColor: 'text-amber-500'
      },
      streak: {
        icon: Sparkles,
        title: 'Daily Streak 🔥',
        subtitle: message || 'Keep your streak alive',
        gradient: 'from-orange-500 to-red-600',
        iconColor: 'text-orange-500'
      },
      titleUp: {
        icon: Trophy,
        title: 'New Title Unlocked 👑',
        subtitle: message || 'Level up! A new title has been assigned to you.',
        gradient: 'from-fuchsia-500 to-purple-600',
        iconColor: 'text-fuchsia-500'
      }
    };

    return configs[eventType] || configs.signup;
  };

  const config = getEventConfig();
  const IconComponent = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${config.gradient} p-8 text-center`}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2,
                    type: 'spring',
                    damping: 20,
                    stiffness: 300
                  }}
                  className="inline-block p-6 bg-white/20 backdrop-blur-sm rounded-full mb-4"
                >
                  <IconComponent className="w-16 h-16 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {config.title}
                </motion.h2>
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-700 dark:text-gray-300 mb-6"
                >
                  {message || config.subtitle}
                </motion.p>

                {/* Animated Stars */}
                <div className="flex justify-center gap-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.5 + (i * 0.1),
                        type: 'spring',
                        damping: 15
                      }}
                    >
                      <Sparkles className={`w-6 h-6 ${config.iconColor}`} />
                    </motion.div>
                  ))}
                </div>

                {/* Continue Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleClose}
                  className={`px-8 py-3 bg-gradient-to-r ${config.gradient} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
                >
                  Continue
                </motion.button>
              </div>
            </div>

            {/* Floating particles animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: '100%', 
                    x: `${Math.random() * 100}%`,
                    opacity: 0
                  }}
                  animate={{ 
                    y: '-100%',
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className={`absolute w-2 h-2 rounded-full ${config.iconColor} opacity-50`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;
