import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Trophy, Search, Award, GraduationCap } from 'lucide-react';
import StudentStatsModal from '../../components/student/StudentStatsModal';
import { useTranslation } from 'react-i18next';

const Podium = ({ top }) => {
  if (!top || top.length === 0) return null;
  const [first, second, third] = [top[0], top[1], top[2]];

  const Card = ({ student, rank, color }) => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22, delay: rank * 0.05 }}
      className={`relative flex flex-col items-center justify-end rounded-xl shadow-md border ${color.bg} ${color.border} px-4 py-4 md:px-5 md:py-5 w-full`}
    >
      <div className={`absolute -top-3 px-3 py-1 rounded-full text-xs font-semibold ${color.badge}`}>#{rank}</div>
      <div className={`absolute inset-0 rounded-xl ${color.glow} pointer-events-none`} />
      {student?.avatar ? (
        <img
          src={student.avatar}
          alt={student.name}
          className={`rounded-full object-cover border-2 border-white shadow ${rank === 1 ? 'w-20 h-20' : 'w-16 h-16'}`}
        />
      ) : (
        <div
          className={`rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 border border-white/30 ${
            rank === 1 ? 'w-20 h-20 text-xl' : 'w-16 h-16 text-lg'
          }`}
        >
          {(student?.name || 'S')[0]}
        </div>
      )}
      <div className="mt-3 text-center">
        <div
          className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 dark:text-white truncate max-w-[180px]"
          title={student?.name}
        >
          {student?.name || 'Student'}
        </div>
        <div className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 font-semibold">
          {(student?.points || 0).toLocaleString()} pts
        </div>
        {( (student?.certificatesCount || 0) > 0 || (student?.completedCoursesCount || 0) > 0) && (
          <div className="mt-1 flex items-center justify-center gap-3 text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
            {(student?.certificatesCount || 0) > 0 && (
              <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {student?.certificatesCount} certs</span>
            )}
            {(student?.completedCoursesCount || 0) > 0 && (
              <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {student?.completedCoursesCount} complete</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const colors = {
    first: { bg: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/10', border: 'border-yellow-200 dark:border-amber-700', badge: 'bg-yellow-500 text-white', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.35)]' },
    second: { bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/10', border: 'border-blue-200 dark:border-blue-700', badge: 'bg-blue-500 text-white', glow: 'shadow-[0_0_24px_rgba(59,130,246,0.30)]' },
    third: { bg: 'bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/10', border: 'border-purple-200 dark:border-purple-700', badge: 'bg-purple-600 text-white', glow: 'shadow-[0_0_24px_rgba(168,85,247,0.30)]' }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
      {second && (
        <div className="sm:order-1">
          <Card student={second} rank={2} color={colors.second} />
        </div>
      )}
      {first && (
        <div className="sm:order-2 sm:-mt-2">
          <Card student={first} rank={1} color={colors.first} />
        </div>
      )}
      {third && (
        <div className="sm:order-3">
          <Card student={third} rank={3} color={colors.third} />
        </div>
      )}
    </div>
  );
};

const Confetti = ({ show }) => {
  if (!show) return null;
  const pieces = new Array(24).fill(0);
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute block w-2 h-2 rounded-sm"
          style={{
            left: `${(i * 41) % 100}%`,
            top: '-10px',
            backgroundColor: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#A855F7'][i % 5],
            transform: `rotate(${(i * 73) % 360}deg)`,
            animation: `fall ${2 + (i % 5) * 0.3}s ease-in-out ${i * 0.05}s forwards`
          }}
        />
      ))}
      <style>{`@keyframes fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1 } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0 } }`}</style>
    </div>
  );
};

const Leaderboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'he', 'fa'].some((lng) => (i18n.language || '').startsWith(lng));
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const didFirstLoad = useRef(false);
  const lastRefreshRef = useRef(0);

  const topThree = useMemo(() => items.slice(0, 3), [items]);
  const rest = useMemo(() => items.slice(3), [items]);

  const fetchLeaderboard = async (opts = {}) => {
    const { page: p = 1, reset = false, query = q } = opts;
    try {
      if (p === 1 && !reset) setLoading(true);
      if (p > 1) setLoadingMore(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/gamification/leaderboard', {
        params: { page: p, limit, q: query || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || {};
      setTotal(data.total || 0);
      if (reset || p === 1) {
        setItems(data.leaderboard || []);
      } else {
        setItems(prev => [...prev, ...(data.leaderboard || [])]);
      }
      setPage(p);
      if (p === 1) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => { 
    fetchLeaderboard({ page: 1, reset: true }); 
    didFirstLoad.current = true;
  }, []);

  // Refresh when gamification events happen (points awarded)
  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 1000) return; // throttle refresh to once per second
      lastRefreshRef.current = now;
      fetchLeaderboard({ page: 1, reset: true });
    };
    window.addEventListener('gamification:notify', handler);
    window.addEventListener('show-gamification-toast', handler);
    return () => {
      window.removeEventListener('gamification:notify', handler);
      window.removeEventListener('show-gamification-toast', handler);
    };
  }, []);

  const canLoadMore = items.length < total;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 py-12 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Confetti show={showConfetti} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white flex items-center justify-center shadow">
              <Trophy className="w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{t('leaderboard') || 'Leaderboard'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className={`w-4 h-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { const query = q.trim(); if (query === '') { fetchLeaderboard({ page: 1, reset: true }); } else { fetchLeaderboard({ page: 1, reset: true, query }); } } }}
                placeholder={t('searchStudents') || 'Search students by name or email'}
                className={`${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 w-56 md:w-72 lg:w-80`}
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const query = q.trim();
                if (query === '') {
                  fetchLeaderboard({ page: 1, reset: true });
                } else {
                  fetchLeaderboard({ page: 1, reset: true, query });
                }
              }}
              className="px-3 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-70 whitespace-nowrap"
            >
              {t('searchLabel') || 'Search'}
            </button>
          </div>
        </div>

        {/* Podium */}
        <div className="mb-8">
          <Podium top={topThree} />
        </div>

        {/* Full list */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {t('leaderboard') || 'Leaderboard'}
          </div>
          <div>
            {loading && items.length === 0 ? (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : (
              items.length === 0 ? (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  {t('noStudentsFound') || 'No students found'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((s) => (
                    <li
                      key={`${s.id}-${s.rank}`}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => { setSelectedStudent(s.id); setModalOpen(true); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-xs font-bold text-gray-500 dark:text-gray-400">#{s.rank}</div>
                        {s.avatar ? (
                          <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-200">
                            {(s.name || 'S')[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">{s.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.email}</div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold">{(s.points || 0).toLocaleString()} pts</div>
                          {s.certificatesCount > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">🏅 {s.certificatesCount}</div>
                          )}
                          {s.completedCoursesCount > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">🎓 {s.completedCoursesCount}</div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
            {canLoadMore && (
              <div className="p-4 text-center">
                <button
                  disabled={loadingMore}
                  onClick={() => fetchLeaderboard({ page: page + 1 })}
                  className="px-4 py-2 text-sm rounded-md bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-70"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <StudentStatsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} studentId={selectedStudent} />
    </div>
  );
};

export default Leaderboard;
