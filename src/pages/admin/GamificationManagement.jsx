import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit2, Trash2, Save, X, Award, Settings, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '../../contexts/ThemeContext';

const GamificationManagement = () => {
  const { theme } = useTheme();
  const [badges, setBadges] = useState([]);
  const [pointSettings, setPointSettings] = useState({ lesson: 5, quiz: 10, course: 50, assignment: 8, project: 12 });
  const [conversionSettings, setConversionSettings] = useState({ pointsRequired: 500, sypValue: 10000, minimumPointsThreshold: 500, enableBalancePayments: true });
  const [loading, setLoading] = useState(true);
  const [savingConversion, setSavingConversion] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalPoints: 0, totalBadges: 0 });
  const [badgeQuery, setBadgeQuery] = useState('');
  const [badgeTypeFilter, setBadgeTypeFilter] = useState('');
  const [badgeSort, setBadgeSort] = useState('title');
  
  const [badgeForm, setBadgeForm] = useState({
    title: '',
    description: '',
    icon: '🏅',
    conditionType: 'lesson',
    threshold: 1,
    pointsReward: 0
  });


  const iconOptions = ['🏅', '🚀', '🧠', '🎓', '🔥', '⚡', '⭐', '📚', '🏆', '🎯', '💎', '👑', '🌟', '💪', '🎪'];
  const conditionTypes = [
    { value: 'lesson', label: 'Lessons Completed' },
    { value: 'quiz', label: 'Quizzes Completed' },
    { value: 'course', label: 'Courses Completed' },
    { value: 'streak', label: 'Login Streak (Days)' },
    { value: 'points', label: 'Total Points' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [badgesRes, settingsRes, leaderboardRes] = await Promise.all([
        axios.get('/api/gamification/badges'),
        axios.get('/api/gamification/settings'),
        axios.get('/api/gamification/leaderboard?limit=10')
      ]);

      setBadges(badgesRes.data.badges || []);
      const pv = settingsRes.data.pointValues || {};
      setPointSettings({
        lesson: pv.lesson ?? 5,
        quiz: pv.quiz ?? 10,
        course: pv.course ?? 50,
        assignment: pv.assignment ?? 8,
        project: pv.project ?? 12
      });
      
      // Load conversion settings
      const cs = settingsRes.data.conversionSettings || {};
      setConversionSettings({
        pointsRequired: cs.pointsRequired ?? 500,
        sypValue: cs.sypValue ?? 10000,
        minimumPointsThreshold: cs.minimumPointsThreshold ?? 500,
        enableBalancePayments: cs.enableBalancePayments !== false
      });
      
      setLeaderboard(leaderboardRes.data.leaderboard || []);

      // Calculate stats
      const totalBadges = badgesRes.data.badges?.length || 0;
      const totalPoints = leaderboardRes.data.leaderboard?.reduce((sum, s) => sum + s.points, 0) || 0;
      const totalStudents = leaderboardRes.data.leaderboard?.length || 0;
      
      setStats({ totalStudents, totalPoints, totalBadges });
    } catch (error) {
      console.error('Fetch gamification data error:', error);
      toast.error('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  // Badge handlers
  const handleCreateBadge = () => {
    setBadgeForm({ title: '', description: '', icon: '🏅', conditionType: 'lesson', threshold: 1, pointsReward: 0 });
    setEditingBadge(null);
    setShowBadgeModal(true);
  };

  const handleEditBadge = (badge) => {
    setBadgeForm({
      title: badge.title,
      description: badge.description || '',
      icon: badge.icon || '🏅',
      conditionType: badge.conditionType || 'lesson',
      threshold: badge.threshold || 1,
      pointsReward: badge.pointsReward || 0
    });
    setEditingBadge(badge);
    setShowBadgeModal(true);
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!window.confirm('Delete this badge?')) return;
    try {
      await axios.delete(`/api/gamification/badges/${badgeId}`);
      toast.success('Badge deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Delete badge error:', error);
      toast.error('Failed to delete badge');
    }
  };

  const handleToggleBadgeActive = async (badge) => {
    try {
      await axios.put(`/api/gamification/badges/${badge._id}`, { isActive: !badge.isActive });
      setBadges((prev) => prev.map((b) => (b._id === badge._id ? { ...b, isActive: !badge.isActive } : b)));
    } catch (error) {
      console.error('Toggle badge active error:', error);
      toast.error('Failed to update badge status');
    }
  };


  const handleSavePointSettings = async () => {
    try {
      await axios.put('/api/gamification/settings', pointSettings);
      toast.success('Point settings updated successfully');
    } catch (error) {
      console.error('Update point settings error:', error);
      toast.error('Failed to update point settings');
    }
  };

  const handleSaveConversionSettings = async () => {
    try {
      setSavingConversion(true);
      await axios.put('/api/gamification/conversion-settings', conversionSettings);
      toast.success('Conversion settings updated successfully');
    } catch (error) {
      console.error('Update conversion settings error:', error);
      toast.error('Failed to update conversion settings');
    } finally {
      setSavingConversion(false);
    }
  };

  

  const handleSaveBadge = async () => {
    try {
      if (editingBadge) {
        await axios.put(`/api/gamification/badges/${editingBadge._id}`, badgeForm);
        toast.success('Badge updated successfully');
      } else {
        await axios.post('/api/gamification/badges', badgeForm);
        toast.success('Badge created successfully');
      }
      setShowBadgeModal(false);
      fetchData();
    } catch (error) {
      console.error('Save badge error:', error);
      toast.error('Failed to save badge');
    }
  };

  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-600" />
            Gamification & Badges
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage student motivation system
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-3"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium truncate">Total Badges</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.totalBadges}</p>
            </div>
            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </motion.div>


      {/* Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${theme==='dark'?'bg-gray-800':'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingBadge?'Edit Badge':'Create New Badge'}</h3>
              <button onClick={()=>setShowBadgeModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input type="text" value={badgeForm.title} onChange={(e)=>setBadgeForm({...badgeForm,title:e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={badgeForm.description} onChange={(e)=>setBadgeForm({...badgeForm,description:e.target.value})} className="input-field" rows={2} />
              </div>
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon)=>(
                    <button key={icon} onClick={()=>setBadgeForm({...badgeForm,icon})} className={`text-3xl p-2 rounded-lg border-2 transition-all ${badgeForm.icon===icon?'border-primary-600 bg-primary-50 dark:bg-primary-900/30':'border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Condition Type</label>
                  <select className="input-field" value={badgeForm.conditionType} onChange={(e)=>setBadgeForm({...badgeForm,conditionType:e.target.value})}>
                    {conditionTypes.map(ct=> <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Threshold</label>
                  <input type="number" min="1" value={badgeForm.threshold} onChange={(e)=>setBadgeForm({...badgeForm,threshold:parseInt(e.target.value)||1})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Points Reward</label>
                <input type="number" min="0" value={badgeForm.pointsReward} onChange={(e)=>setBadgeForm({...badgeForm,pointsReward:parseInt(e.target.value)||0})} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setShowBadgeModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveBadge} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingBadge?'Update':'Create'}</button>
            </div>
          </motion.div>
        </div>
      )}


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-3"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium truncate">Active Students</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.totalStudents}</p>
            </div>
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-3"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 dark:text-gray-400 text-xs font-medium truncate">Total Points</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Point Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Point Rewards Settings
          </h2>
          <button onClick={handleSavePointSettings} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">Points per Lesson Completed</label>
            <input
              type="number"
              min="0"
              value={pointSettings.lesson}
              onChange={(e) => setPointSettings({ ...pointSettings, lesson: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Points per Quiz Completed</label>
            <input
              type="number"
              min="0"
              value={pointSettings.quiz}
              onChange={(e) => setPointSettings({ ...pointSettings, quiz: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Points per Course Completed</label>
            <input
              type="number"
              min="0"
              value={pointSettings.course}
              onChange={(e) => setPointSettings({ ...pointSettings, course: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Points per Assignment Submission</label>
            <input
              type="number"
              min="0"
              value={pointSettings.assignment}
              onChange={(e) => setPointSettings({ ...pointSettings, assignment: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Points per Project Submission</label>
            <input
              type="number"
              min="0"
              value={pointSettings.project}
              onChange={(e) => setPointSettings({ ...pointSettings, project: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>
        </div>
      </motion.div>

      {/* Points-to-Balance Conversion Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Points-to-Balance Conversion
          </h2>
          <button 
            onClick={handleSaveConversionSettings} 
            disabled={savingConversion}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingConversion ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Allow Paying With Wallet Balance</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enable students to use points balance during checkout</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!conversionSettings.enableBalancePayments}
              onChange={(e) => {
                const next = e.target.checked;
                const msg = next
                  ? 'Enable paying with wallet balance? Students will be able to use their wallet balance (converted points) at checkout.'
                  : 'Disable paying with wallet balance? Students will NOT be able to use wallet balance at checkout.';
                if (!window.confirm(msg)) return;
                setConversionSettings({ ...conversionSettings, enableBalancePayments: next });
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>How it works:</strong> Students can use their earned points as wallet balance for course payments. 
            Set the conversion rate below. Example: 500 points = 10,000 SYP means 1 point = 20 SYP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">Points Required</label>
            <input
              type="number"
              min="1"
              value={conversionSettings.pointsRequired}
              onChange={(e) => setConversionSettings({ 
                ...conversionSettings, 
                pointsRequired: parseInt(e.target.value) || 1 
              })}
              className="input-field"
              placeholder="e.g., 500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of points needed for conversion
            </p>
          </div>
          <div>
            <label className="label">SYP Value</label>
            <input
              type="number"
              min="1"
              value={conversionSettings.sypValue}
              onChange={(e) => setConversionSettings({ 
                ...conversionSettings, 
                sypValue: parseInt(e.target.value) || 1 
              })}
              className="input-field"
              placeholder="e.g., 10000"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              SYP value for the points above
            </p>
          </div>
          <div>
            <label className="label">Minimum Points Threshold</label>
            <input
              type="number"
              min="0"
              value={conversionSettings.minimumPointsThreshold}
              onChange={(e) => setConversionSettings({ 
                ...conversionSettings, 
                minimumPointsThreshold: parseInt(e.target.value) || 0 
              })}
              className="input-field"
              placeholder="e.g., 500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum points to use balance in payments
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Current Rate:</strong> {conversionSettings.pointsRequired} points = {conversionSettings.sypValue.toLocaleString()} SYP 
            ({conversionSettings.sypValue > 0 ? `1 point = ${(conversionSettings.sypValue / conversionSettings.pointsRequired).toLocaleString()} SYP` : '0 SYP/point'})
          </p>
        </div>
      </motion.div>

      {/* Badges Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Badge Management</h2>
          <button onClick={handleCreateBadge} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Badge
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge._id}
              className={`p-4 rounded-lg border-2 ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{badge.icon}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditBadge(badge)}
                    className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge._id)}
                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{badge.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{badge.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  {conditionTypes.find(t => t.value === badge.conditionType)?.label}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  +{badge.pointsReward} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Students</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.map((student) => (
                <tr key={student.email}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-2xl ${student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : ''}`}>
                      {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full mr-3" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3">
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-primary-600 dark:text-primary-400">{student.points.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                      {student.badgeCount} badges
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
              </h3>
              <button onClick={() => setShowBadgeModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Badge Title</label>
                <input
                  type="text"
                  value={badgeForm.title}
                  onChange={(e) => setBadgeForm({ ...badgeForm, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Fast Learner"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="e.g., Complete 5 lessons"
                />
              </div>

              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setBadgeForm({ ...badgeForm, icon })}
                      className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                        badgeForm.icon === icon
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Condition Type</label>
                <select
                  value={badgeForm.conditionType}
                  onChange={(e) => setBadgeForm({ ...badgeForm, conditionType: e.target.value })}
                  className="input-field"
                >
                  {conditionTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={badgeForm.threshold}
                  onChange={(e) => setBadgeForm({ ...badgeForm, threshold: parseInt(e.target.value) || 1 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Bonus Points Reward</label>
                <input
                  type="number"
                  min="0"
                  value={badgeForm.pointsReward}
                  onChange={(e) => setBadgeForm({ ...badgeForm, pointsReward: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowBadgeModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveBadge} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingBadge ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GamificationManagement;
