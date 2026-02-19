import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageTransition from '../../components/common/PageTransition';

const TrustedDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/2fa/devices');
      setDevices(res.data.devices || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id) => {
    if (!window.confirm('Remove this trusted device?')) return;
    try {
      await axios.delete(`/api/auth/2fa/devices/${id}`);
      toast.success('Device revoked');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to revoke device');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Trusted Devices</h1>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
              {devices.length === 0 ? (
                <div className="p-6 text-gray-600 dark:text-gray-400">No trusted devices.</div>
              ) : (
                devices.map((d) => (
                  <div key={d.id} className="p-6 flex items-center justify-between">
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{d.deviceName || 'Trusted Device'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Added: {new Date(d.createdAt).toLocaleString()}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Expires: {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <button onClick={() => revoke(d.id)} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Revoke</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default TrustedDevices;
