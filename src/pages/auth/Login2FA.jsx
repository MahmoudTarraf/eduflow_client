import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageTransition from '../../components/common/PageTransition';
import OtpInput from '../../components/common/OtpInput';

const Login2FA = () => {
  const { submitTwoFactor } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [deviceName, setDeviceName] = useState('This device');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await submitTwoFactor({ code, rememberDevice: remember, deviceName });
    setLoading(false);
    if (res.success) navigate('/');
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter the 6-digit code from your authenticator app</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">6-digit code</label>
                <OtpInput
                  value={code}
                  onChange={setCode}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="h-4 w-4 text-primary-600" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Remember this device for 30 days</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Device name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., My Laptop"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify and Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login2FA;
