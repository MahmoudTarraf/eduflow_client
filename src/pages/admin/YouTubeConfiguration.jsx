import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Link2, Unlink, RefreshCw, ExternalLink, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch (_) {
    return '—';
  }
};

const formatExpiry = (ms) => {
  if (!ms) return '—';
  try {
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch (_) {
    return '—';
  }
};

const clamp01 = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
};

const YouTubeConfiguration = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const rawBase = process.env.REACT_APP_API_URL || 'https://eduflow-server-87rv.onrender.com';
  const apiBase = rawBase
    ? `${String(rawBase).replace(/\/+$/, '')}${String(rawBase).replace(/\/+$/, '').endsWith('/api') ? '' : '/api'}`
    : '/api';

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${apiBase}/youtube/admin/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data || null);
    } catch (error) {
      console.error('Failed to load YouTube configuration:', error);
      toast.error(error?.response?.data?.message || 'Failed to load YouTube configuration');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();

    const status = query.get('status');
    if (status === 'success') {
      toast.success('YouTube connected successfully');
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (_) { }
    } else if (status === 'error') {
      toast.error('YouTube connection failed. Please try again.');
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (_) { }
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = localStorage.getItem('token');

      // We request JSON mode so backend returns { authUrl }. Then we redirect client-side.
      const res = await axios.get(`${apiBase}/youtube/auth?mode=json`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const authUrl = res?.data?.authUrl;
      if (!authUrl) {
        throw new Error('Missing authUrl');
      }

      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate YouTube auth:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to initiate YouTube authentication');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect the platform YouTube account? Uploads will fail until reconnected.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiBase}/youtube/disconnect`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('YouTube disconnected');
      await fetchSummary();
    } catch (error) {
      console.error('Failed to disconnect YouTube:', error);
      toast.error(error?.response?.data?.message || 'Failed to disconnect YouTube');
    } finally {
      setDisconnecting(false);
    }
  };

  const connection = summary?.connection || {};
  const quota = summary?.quota || {};
  const overview = summary?.overview || {};

  const connected = !!connection.connected;
  const status = connection.status || (connected ? 'CONNECTED' : 'DISCONNECTED');

  const statusBadge = useMemo(() => {
    if (status === 'CONNECTED') {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Connected',
        className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
      };
    }
    if (status === 'REAUTH_REQUIRED') {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        label: 'Re-auth Required',
        className: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800'
      };
    }
    return {
      icon: <XCircle className="w-4 h-4" />,
      label: 'Not Connected',
      className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    };
  }, [status]);

  const dailyLimit = Number(quota.dailyLimit) || 10000;
  const used = Number(quota.usedToday) || 0;
  const remaining = Number(quota.remainingToday) || Math.max(0, dailyLimit - used);
  const pct = clamp01(dailyLimit > 0 ? used / dailyLimit : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">YouTube Configuration</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connect one centralized YouTube account for all platform uploads.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSummary}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Connection Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Connection</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
              OAuth must be initiated from this UI. Tokens are stored server-side and never exposed to instructors.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${statusBadge.className}`}>
            {statusBadge.icon}
            {statusBadge.label}
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-50"
            onClick={handleConnect}
            disabled={connecting}
          >
            <Link2 className="w-5 h-5" />
            {connecting ? 'Redirecting…' : 'Initiate YouTube Authentication'}
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-medium disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100"
            onClick={handleDisconnect}
            disabled={disconnecting || !connected}
          >
            <Unlink className="w-5 h-5" />
            {disconnecting ? 'Disconnecting…' : 'Disconnect YouTube'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Channel Name</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{connection.channelName || '—'}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Channel ID</div>
            <div className="text-sm font-mono text-gray-900 dark:text-white mt-1 break-all">{connection.channelId || '—'}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Connected Account Email</div>
            <div className="text-sm text-gray-900 dark:text-white mt-1">{connection.connectedEmail || '—'}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Token Expiry</div>
            <div className="text-sm text-gray-900 dark:text-white mt-1">{formatExpiry(connection.expiryDate)}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Connected At</div>
            <div className="text-sm text-gray-900 dark:text-white mt-1">{formatDateTime(connection.connectedAt)}</div>
          </div>
        </div>

        {!connected && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            No YouTube account is currently connected. Video uploads will fail until a YouTube account is authenticated.
          </div>
        )}

        {status === 'REAUTH_REQUIRED' && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            The stored YouTube token could not be refreshed. Please re-authenticate using the button above.
          </div>
        )}
      </div>

      {/* Quota */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quota & Usage</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
          Estimated quota usage. Upload ≈ 1600 units/video. Metadata updates ≈ 50 units. Reads are low cost.
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
            <span>Used / Total</span>
            <span className="font-mono">{used} / {dailyLimit}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-800">
            <div className="h-full bg-purple-600" style={{ width: `${Math.round(pct * 100)}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Quota Used Today</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{used}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Quota Remaining</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{remaining}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Uploads Today (estimated)</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{quota.uploadsToday ?? '—'}</div>
            </div>
          </div>

          {quota.warning && (
            <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              Uploads may fail today due to quota exhaustion.
            </div>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 dark:bg-gray-900 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Video Overview</h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Videos Uploaded via API</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{overview.totalVideos ?? '—'}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Last Upload Timestamp</div>
            <div className="text-sm text-gray-900 dark:text-white mt-1">{formatDateTime(overview.lastUploadAt)}</div>
          </div>
          <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Last Upload Status</div>
            <div className="text-sm text-gray-900 dark:text-white mt-1">{overview.lastUploadStatus || '—'}</div>
          </div>
        </div>

        {overview.youtubeStudioUrl && (
          <div className="mt-4">
            <a
              href={overview.youtubeStudioUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open YouTube Studio
            </a>
          </div>
        )}
      </div>

      {/* Requirements */}
      <details className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-900 dark:border-gray-700">
        <summary className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-white">
          Google Cloud Console Requirements
        </summary>
        <div className="mt-4 text-sm text-gray-700 dark:text-gray-200 space-y-3">
          <div>
            Ensure YouTube Data API v3 is enabled.
          </div>
          <div>
            OAuth Consent Screen:
            <div className="mt-1 text-gray-600 dark:text-gray-300">
              Type: External (or Internal if Workspace). App verified is recommended.
            </div>
          </div>
          <div>
            OAuth Credentials:
            <div className="mt-1 text-gray-600 dark:text-gray-300">
              Type: Web Application
              <div className="mt-1">Authorized redirect URI:</div>
              <div className="mt-1 font-mono break-all">https://YOUR_DOMAIN/api/youtube/callback</div>
            </div>
          </div>
          <div>
            Quota increases:
            <div className="mt-1 text-gray-600 dark:text-gray-300">
              Requested via Google Cloud → Quotas → YouTube Data API. Approval depends on use case.
            </div>
          </div>
        </div>
      </details>

      {loading && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">Loading…</div>
      )}
    </div>
  );
};

export default YouTubeConfiguration;
