import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import OtpInput from '../../components/common/OtpInput';

const TwoFASettings = () => {
  const { user, refreshUser } = useAuth();
  const [qr, setQr] = useState(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const startSetup = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/2fa/setup');
      setQr(res.data.qr);
      setSecret(res.data.secret);
      toast.success('Scan the QR code with your authenticator app');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;
    try {
      setVerifying(true);
      const res = await axios.post('/api/auth/2fa/verify-setup', { code });
      setBackupCodes(res.data.backupCodes || []);
      await refreshUser();
      toast.success('Two-factor authentication enabled');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid 2FA code');
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    try {
      setDisabling(true);
      await axios.post('/api/auth/2fa/disable');
      await refreshUser();
      setQr(null); setSecret(''); setCode(''); setBackupCodes([]);
      toast.success('Two-factor authentication disabled');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  const showSetup = !user?.twoFactorEnabled;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h1>

          {showSetup ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Enable Two-Factor Authentication (TOTP)</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Use Google Authenticator, Authy, or compatible apps.</p>

              {!qr ? (
                <button onClick={startSetup} disabled={loading} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                  {loading ? 'Preparing…' : 'Generate QR Code'}
                </button>
              ) : (
                <div className="mt-6">
                  <div className="flex items-center space-x-6">
                    <img src={qr} alt="2FA QR" className="w-40 h-40 border rounded" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Or enter this code manually:</div>
                      <div className="font-mono text-lg text-gray-900 dark:text-white break-words">{secret}</div>
                    </div>
                  </div>

                  <form onSubmit={verifySetup} className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter 6-digit code</label>
                    <OtpInput
                      value={code}
                      onChange={setCode}
                      disabled={verifying}
                      autoFocus
                    />
                    <div className="mt-4">
                      <button type="submit" disabled={verifying || code.length !== 6} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
                        {verifying ? 'Verifying…' : 'Activate 2FA'}
                      </button>
                    </div>
                  </form>

                  {backupCodes.length > 0 && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Backup Codes (store securely)</div>
                      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {backupCodes.map((c, i) => (
                          <li key={i} className="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Two-Factor Authentication is enabled</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">You can disable 2FA or manage trusted devices.</p>
              <div className="mt-4 flex items-center space-x-3">
                <button onClick={disable2FA} disabled={disabling} className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50">{disabling ? 'Disabling…' : 'Disable 2FA'}</button>
                <a href="/security/devices" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Trusted Devices</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TwoFASettings;
