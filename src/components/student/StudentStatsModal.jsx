import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Trophy, Award, GraduationCap, X } from 'lucide-react';

const StudentStatsModal = ({ isOpen, onClose, studentId }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    let mounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/gamification/student/${studentId}/public-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mounted) setStats(res.data.stats || null);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load stats');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, [isOpen, studentId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full sm:max-w-2xl mx-2 sm:mx-0 bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {stats?.avatar ? (
                  <img src={stats.avatar} alt={stats?.name || 'Student'} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                    {(stats?.name || 'S')[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats?.name || 'Student Stats'}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Public profile stats</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-4 text-red-600 dark:text-red-400">{error}</div>
              )}

              {stats && !loading && (
                <>
                  {/* Top cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Total Points</div>
                          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{stats.points?.toLocaleString?.() || stats.points || 0}</div>
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Badges</div>
                          <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">{stats.badgeCount || 0}</div>
                        </div>
                        <Award className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-green-700 dark:text-green-300 font-medium">Completed Courses</div>
                          <div className="text-2xl font-bold text-green-900 dark:text-green-200">{stats.completedCoursesCount || 0}</div>
                        </div>
                        <GraduationCap className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Certificates */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Certificates</h4>
                    {stats.certificates && stats.certificates.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {stats.certificates.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/60 rounded border border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-800 dark:text-gray-200">{c.courseName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : ''}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No certificates yet</div>
                    )}
                  </div>

                  {/* Activity summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Assignments & Projects</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assignmentsFinished || 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tests Completed</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.testsCompleted || 0}</div>
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Recent Achievements</h4>
                    {stats.recentAchievements && stats.recentAchievements.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {stats.recentAchievements.map((a) => (
                          <div key={a.id} className="p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{a.message || a.type}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {a.points ? <span>+{a.points} pts</span> : null}
                              <span>{new Date(a.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No recent achievements</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StudentStatsModal;
