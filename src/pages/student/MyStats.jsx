import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, TrendingUp, Target, Flame, GraduationCap, BookOpen, User, Calendar, ChevronDown, ChevronUp, Brain, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import TourGuide from '../../components/common/TourGuide';
import { getMyAchievementsTour } from '../../config/tours';

const MyStats = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesExpanded, setActivitiesExpanded] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAchievements();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gamification/my-stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Fetch stats error:', error);
      toast.error('Failed to load your stats');
    } finally {
      setLoading(false);
    }
  };


  const fetchAchievements = async () => {
    try {
      const res = await axios.get('/api/gamification/my-achievements?limit=20');
      setAchievements(res.data.achievements || []);
    } catch (error) {
      console.error('Fetch achievements error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No stats available</p>
      </div>
    );
  }

  const progressData = [
    {
      label: 'Lessons',
      count: stats.lessonsCompleted || 0,
      icon: BookOpen,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Quizzes',
      count: stats.quizzesCompleted || 0,
      icon: Brain,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Courses',
      count: stats.coursesCompleted || 0,
      icon: GraduationCap,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          data-tour="achievements-header"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-600" />
            {t('myAchievements')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('trackYourProgress')}
          </p>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mt-8"
          data-tour="achievements-activities"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setActivitiesExpanded(!activitiesExpanded)}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <span>{t('recentActivities')}</span>
              {activitiesExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              {achievements.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {achievements.length} {achievements.length === 1 ? 'activity' : 'activities'}
                </span>
              )}
              <button onClick={fetchAchievements} className="btn-secondary">{t('refresh')}</button>
            </div>
          </div>
          
          {activitiesExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {achievements.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('noRecentActivities')}</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {achievements.map((a) => (
                <div key={a._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600">
                      {a.type === 'points' && <Trophy className="w-6 h-6 text-yellow-600" />}
                      {a.type === 'badge' && <Award className="w-6 h-6 text-amber-600" />}
                      {a.type === 'title' && <GraduationCap className="w-6 h-6 text-indigo-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900 dark:text-white text-lg">
                          {a.type === 'points' && `+${a.points} ${t('pointsEarned')}`}
                          {a.type === 'badge' && `${a.badgeIcon || '🏅'} ${a.badgeTitle} ${t('badgeUnlocked')}`}
                          {a.type === 'title' && `${a.titleIcon || '👑'} ${a.titleName} ${t('titleEarned')}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {a.message && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{a.message}</div>
                      )}
                      {/* Show detailed context information */}
                      {a.courseName && (
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          📚 Course: <span className="font-medium">{a.courseName}</span>
                        </div>
                      )}
                      {a.lessonName && (
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          📖 Lesson: <span className="font-medium">{a.lessonName}</span>
                        </div>
                      )}
                      {a.videoName && (
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          🎥 Video: <span className="font-medium">{a.videoName}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(a.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-12">
          {/* Total Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-200 dark:border-yellow-800"
            data-tour="achievements-points-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 dark:text-yellow-400 text-sm font-medium mb-1">{t('totalPoints')}</p>
                <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-200">{stats.points.toLocaleString()}</p>
                {stats.walletBalance > 0 && (
                  <div className="mt-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full inline-block text-xs font-medium">
                    💰 Wallet: {stats.walletBalance.toLocaleString()} SYP
                  </div>
                )}
                {stats.conversionRate && (
                  <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    Rate: {stats.conversionRate.pointsRequired} pts = {stats.conversionRate.sypValue.toLocaleString()} SYP
                  </div>
                )}
                {stats.title && (
                  <div className="mt-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full inline-block text-xs font-medium">
                    Title: {stats.title}
                  </div>
                )}
              </div>
              <div className="p-4 bg-yellow-200 dark:bg-yellow-800/30 rounded-full">
                <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </motion.div>

          {/* Streak Days */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 border-2 border-orange-200 dark:border-orange-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 dark:text-orange-400 text-sm font-medium mb-1">{t('currentStreak')}</p>
                <p className="text-4xl font-bold text-orange-900 dark:text-orange-200">{stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}</p>
              </div>
              <div className="p-4 bg-orange-200 dark:bg-orange-800/30 rounded-full">
                <Flame className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>

          {/* Badges Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 dark:text-purple-400 text-sm font-medium mb-1">{t('badgesEarned')}</p>
                <p className="text-4xl font-bold text-purple-900 dark:text-purple-200">{stats.badgeCount}</p>
              </div>
              <div className="p-4 bg-purple-200 dark:bg-purple-800/30 rounded-full">
                <Award className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t('activityOverview')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {progressData.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`p-4 rounded-lg ${item.bgColor}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-8 h-8 ${item.textColor}`} />
                    <span className={`text-3xl font-bold ${item.textColor}`}>{item.count}</span>
                  </div>
                  <p className={`font-medium ${item.textColor}`}>{item.label} Completed</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Badges Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
          data-tour="achievements-badges"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" />
            {t('yourBadges')}
          </h2>

          {stats.badges && stats.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.badges.map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-lg text-center border-2 ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  } hover:shadow-lg transition-all`}
                >
                  <div className="text-5xl mb-2">{badge.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{badge.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{badge.description}</p>
                  {badge.pointsReward > 0 && (
                    <div className="mt-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium inline-block">
                      +{badge.pointsReward} pts
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('noBadgesYet')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {t('earnBadgesByCompleting')}
              </p>
            </div>
          )}
        </motion.div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card mt-8 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-2 border-primary-200 dark:border-primary-800"
          data-tour="achievements-rewards"
        >
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('keepUpGreatWork')} 🎯
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {stats.streakDays >= 7 
                ? t('amazingStreak')
                : stats.points >= 100 
                ? t('excellentProgress')
                : t('everyStepCounts')}
            </p>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🎉</span>
                <h4 className="font-semibold text-gray-900 dark:text-white">{t('futureRewardsAwait')}</h4>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('keepEarningPoints')}
              </p>
            </div>
          </div>
        </motion.div>

        <TourGuide
          steps={getMyAchievementsTour(t)}
          tourKey="my_achievements"
          showButton={true}
        />
      </div>
    </div>
  );
};

export default MyStats;
