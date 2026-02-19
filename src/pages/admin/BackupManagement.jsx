import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Database, UploadCloud, DownloadCloud } from 'lucide-react';

const BackupManagement = () => {
  const { user } = useAuth();
  const [loadingCleanup, setLoadingCleanup] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingFullBackup, setLoadingFullBackup] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [includeOldMessages, setIncludeOldMessages] = useState(false);
  const [logsDays, setLogsDays] = useState('');
  const [notificationsDays, setNotificationsDays] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restorePassword, setRestorePassword] = useState('');

  const triggerCleanup = async () => {
    try {
      setError(null);
      setResult(null);
      setLoadingCleanup(true);
      const payload = {
        includeOldMessages,
      };
      if (logsDays) payload.logsDays = Number(logsDays);
      if (notificationsDays) payload.notificationsDays = Number(notificationsDays);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/maintenance/cleanup', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoadingCleanup(false);
    }
  };

  const triggerFullBackup = async () => {
    try {
      setError(null);
      setResult(null);
      setLoadingFullBackup(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/backup/full', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoadingFullBackup(false);
    }
  };

  const handleRestore = async () => {
    try {
      if (!restoreFile) {
        setError('Please choose a backup file (.json or .json.gz)');
        return;
      }
      if (!restorePassword) {
        setError('Please enter your admin password to confirm restore');
        return;
      }
      setError(null);
      setResult(null);
      setRestoreLoading(true);
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('backup', restoreFile);
      form.append('password', restorePassword);
      const res = await axios.post('/api/admin/backup/restore', form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setRestoreFile(null);
      setRestorePassword('');
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const triggerBackupReport = async () => {
    try {
      setError(null);
      setResult(null);
      setLoadingBackup(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/maintenance/backup-report', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoadingBackup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Backup Management</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Create and manage backups and run safe cleanup tasks.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Full Backup (Email) */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DownloadCloud className="w-5 h-5" />
                Full Database Backup (Email)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generates a full JSON backup of all collections and emails it to the configured admin email. No files are saved on the server.</p>
              <button
                onClick={triggerFullBackup}
                disabled={loadingFullBackup}
                className="btn-primary w-full"
              >
                {loadingFullBackup ? 'Generating...' : 'Send Full Backup to Admin Email'}
              </button>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Backup Report</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generates a non-media JSON report and emails it to the admin address.</p>
              <button
                onClick={triggerBackupReport}
                disabled={loadingBackup}
                className="btn-primary w-full"
              >
                {loadingBackup ? 'Generating...' : 'Send Backup Report to Admin Email'}
              </button>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Run Cleanup</h2>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Admin logs older than (days)</span>
                  <input
                    type="number"
                    min="1"
                    value={logsDays}
                    onChange={(e) => setLogsDays(e.target.value)}
                    placeholder="e.g., 30"
                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Notifications older than (days)</span>
                  <input
                    type="number"
                    min="1"
                    value={notificationsDays}
                    onChange={(e) => setNotificationsDays(e.target.value)}
                    placeholder="e.g., 60"
                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </label>
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeOldMessages}
                    onChange={(e) => setIncludeOldMessages(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Also delete messages older than 60 days</span>
                </label>
                <button
                  onClick={triggerCleanup}
                  disabled={loadingCleanup}
                  className="btn-secondary w-full"
                >
                  {loadingCleanup ? 'Running...' : 'Run Cleanup Now'}
                </button>
              </div>
            </div>

            {/* Restore Backup */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                Restore Backup
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Backup File (.json or .json.gz)</label>
                  <input
                    type="file"
                    accept=".json,.gz,.json.gz"
                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Confirm Admin Password</label>
                  <input
                    type="password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  onClick={handleRestore}
                  disabled={restoreLoading}
                  className="btn-secondary w-full"
                >
                  {restoreLoading ? 'Restoring...' : 'Restore Now'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Result</h3>
              <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BackupManagement;
