import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Globe,
  MessageCircle,
  Star,
  Trophy
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import StreakIndicator from '../common/StreakIndicator';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [twoFaDismissed, setTwoFaDismissed] = useState(false);

  const profileDropdownRef = useRef(null);
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Fetch streak data for students
      if (user.role === 'student') {
        fetchUserStats();
      }
      
      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
        if (user.role === 'student') {
          fetchUserStats();
        }
      }, 30000);
      
      // Listen for custom events to update immediately
      const handleUnreadCountChanged = () => {
        fetchUnreadCount();
      };
      const handleStreakUpdated = (e) => {
        try {
          const next = e?.detail?.streakDays;
          if (typeof next === 'number') {
            setUserStats((prev) => ({ ...(prev || {}), streakDays: next }));
          }
        } catch (_) {}
        // Also fetch to sync any other gamification fields
        fetchUserStats();
      };

      window.addEventListener('unreadCountChanged', handleUnreadCountChanged);
      window.addEventListener('streak-updated', handleStreakUpdated);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('unreadCountChanged', handleUnreadCountChanged);
        window.removeEventListener('streak-updated', handleStreakUpdated);
      };
    }
  }, [user]);

  // Load 2FA warning dismissal state from sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const dismissed = sessionStorage.getItem('twofa_warning_dismissed');
        if (dismissed === 'true') {
          setTwoFaDismissed(true);
        }
      }
    } catch (e) {}
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/gamification/my-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleLogout = () => {
    // AuthContext.logout now handles redirecting to /login for all roles.
    // Avoid calling navigate here to prevent double navigation / reload.
    logout();
    setIsProfileOpen(false);
  };

  const handleDismissTwoFaWarning = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('twofa_warning_dismissed', 'true');
      }
    } catch (e) {}
    setTwoFaDismissed(true);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'student': return '/student';
      default: return '/';
    }
  };

  const navItems = [
    { name: t('home'), path: '/', hash: '' },
    { name: t('courses'), path: '/', hash: 'courses' },
    { name: t('instructors'), path: '/instructors', hash: '' },
    { name: t('about'), path: '/about', hash: '' },
    { name: t('contact'), path: '/', hash: 'footer' }
  ];

  // Extend desktop nav with Leaderboard for all authenticated roles
  const desktopNavItems = React.useMemo(() => {
    const base = [...navItems];
    if (user && ['student','instructor','admin'].includes(user.role)) {
      base.push({ name: t('leaderboard') || 'Leaderboard', path: '/student/leaderboard', hash: '' });
    }
    return base;
  }, [navItems, user]);

  const navTextClass = React.useMemo(() => {
    if (user && (user.role === 'admin' || user.role === 'instructor')) {
      return 'text-xs md:text-sm lg:text-[0.95rem]';
    }
    return 'text-sm md:text-[0.95rem] lg:text-base';
  }, [user]);

  const navGapClass = React.useMemo(() => {
    if (user && (user.role === 'admin' || user.role === 'instructor')) {
      return 'gap-3 lg:gap-4';
    }
    return 'gap-4 lg:gap-6';
  }, [user]);

  const scrollToSection = async (item) => {
    if (item.path && item.path !== '/') {
      navigate(item.path);
      return;
    }
    if (!item.hash) {
      navigate('/');
      return;
    }
    if (window.location.pathname !== '/') {
      await navigate('/');
      // allow the Home component to render
      setTimeout(() => {
        const el = document.getElementById(item.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      const el = document.getElementById(item.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {t('eduflow')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className={`hidden md:flex justify-center items-center flex-1 min-w-0 overflow-x-auto scrollbar-hide whitespace-nowrap px-2 ${navGapClass}`}>
            {desktopNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item)}
                className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 shrink-0 whitespace-nowrap ${navTextClass}`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex flex-col items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="mt-0.5 text-[10px] leading-none text-gray-400 dark:text-gray-400">
                {language === 'ar' ? 'ع' : 'EN'}
              </span>
            </button>

            {user ? (
              <>
                {/* Streak Indicator for Students */}
                {user.role === 'student' && userStats && (
                  <div 
                    onClick={() => navigate('/student/my-stats')}
                    className="hidden sm:flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                    title={`${userStats.streakDays || 0} day${(userStats.streakDays || 0) !== 1 ? 's' : ''} streak - Click to view achievements`}
                  >
                    <StreakIndicator 
                      streak={userStats.streakDays || 0}
                      compact={true}
                      className=""
                    />
                  </div>
                )}

                {/* Messages */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Security shortcut (admin/instructor) */}
                {(user.role === 'admin' || user.role === 'instructor') && (
                  <Link
                    to="/security"
                    className="hidden md:inline-flex px-3 py-2 rounded-md border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    Security
                  </Link>
                )}

                {/* Instructor Rating (navbar, instructor only)
                    Show the instructor's average rating whenever it is a valid number > 0,
                    regardless of how many courses/ratings contributed to it.
                */}
                {user.role === 'instructor' && (
                  <div className="hidden md:flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>
                      {typeof user.ratingValue === 'number' && user.ratingValue > 0
                        ? Number(user.ratingValue).toFixed(1)
                        : 'N/A'}
                    </span>
                  </div>
                )}

                {/* Dashboard button (admin/instructor/student) */}
                {(user.role === 'admin' || user.role === 'instructor' || user.role === 'student') && (
                  <Link
                    to={getDashboardPath()}
                    className="hidden md:inline-flex btn-primary px-3 py-2"
                  >
                    {t('dashboard')}
                  </Link>
                )}


                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block text-gray-700 dark:text-gray-300 font-medium">
                      {user.name}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[1100]"
                      >
                        <Link
                          to={getDashboardPath()}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>{t('dashboard')}</span>
                        </Link>
                        {(user.role === 'admin' || user.role === 'instructor') && (
                          <Link
                            to="/security"
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            <span>Security</span>
                          </Link>
                        )}
                        {false && user.role === 'instructor' && (
                          <div />
                        )}
                        <Link
                          to="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>{t('profile')}</span>
                        </Link>
                        {(user.role === 'admin' || user.role === 'instructor' || user.role === 'student') && (
                          <Link
                            to={
                              user.role === 'admin' ? '/admin/settings' :
                              user.role === 'instructor' ? '/instructor/settings' :
                              '/student/settings'
                            }
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            <span>{t('settings')}</span>
                          </Link>
                        )}
                        {user.role === 'student' && (
                          <>
                            <Link
                              to="/student/my-stats"
                              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Trophy className="w-5 h-5" />
                              <span>{t('myAchievements')}</span>
                            </Link>
                            <Link
                              to="/student/wishlist"
                              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Star className="w-4 h-4" />
                              <span>{t('wishlist') || 'Wishlist'}</span>
                            </Link>
                            <Link
                              to="/student/certificates"
                              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              <span>{t('certificates')}</span>
                            </Link>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('logout')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn-secondary"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Persistent 2FA warning banner (admin/instructor only) */}
        {user && (user.role === 'admin' || user.role === 'instructor') && user.twoFactorEnabled === false && !twoFaDismissed && (
          <div className="mt-2 mb-3">
            <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded">
              <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-200">
                <span className="mr-2">⚠️</span>
                <span>Your account is at risk — please enable 2FA in Security Settings.</span>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Link
                  to="/security"
                  className="px-3 py-1.5 rounded-md bg-yellow-500 text-white text-xs font-medium hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500"
                >
                  Enable 2FA
                </Link>
                <button
                  type="button"
                  onClick={handleDismissTwoFaWarning}
                  className="p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-100"
                  aria-label="Dismiss 2FA warning"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
            >
              {desktopNavItems.map((item) => (
                <button
                  key={item.name}
                  className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  onClick={() => { setIsOpen(false); scrollToSection(item); }}
                >
                  {item.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
