import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { RefreshCw, Trash2, Eye, X } from 'lucide-react';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';

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

const YouTubeVideoLibrary = () => {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [watchOpen, setWatchOpen] = useState(false);
  const [watchVideo, setWatchVideo] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/youtube/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error('Failed to load YouTube videos:', e);
      setError(e?.response?.data?.message || 'Failed to load videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const closeWatch = useCallback(() => {
    setWatchOpen(false);
    setWatchVideo(null);
    setWatchLoading(false);
  }, []);

  const removeRecord = useCallback(async (video) => {
    const videoRecordId = video?._id;
    if (!videoRecordId) return;
    if (video?.status !== 'physically_deleted') return;

    if (!window.confirm('Remove this database record? This will NOT delete anything from YouTube.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/youtube/${videoRecordId}/record`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res?.data?.message || 'Video record removed');
      setVideos((prev) => (prev || []).filter((v) => v?._id !== videoRecordId));

      if (watchOpen && watchVideo?._id === videoRecordId) {
        closeWatch();
      }
    } catch (e) {
      console.error('Failed to remove record:', e);
      toast.error(e?.response?.data?.message || 'Failed to remove record');
    }
  }, [closeWatch, watchOpen, watchVideo]);

  const startWatch = useCallback((video) => {
    setWatchOpen(true);
    setWatchVideo(video);
    setWatchLoading(false);
  }, []);

  const deleteFromYouTube = useCallback(async (videoRecordId) => {
    if (!window.confirm('Delete this video from the hosting account AND remove its database record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`/api/youtube/${videoRecordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res?.data?.message || 'Video deleted');
      await fetchVideos();
    } catch (e) {
      console.error('Failed to delete from YouTube:', e);
      toast.error(e?.response?.data?.message || 'Failed to delete video');
    }
  }, [fetchVideos]);

  const statusMeaning = useMemo(() => ([
    { key: 'active', text: 'Active: normal, eligible to be shown/used by content.' },
    { key: 'superseded', text: 'Superseded: replaced by another upload for the same content.' },
    { key: 'orphaned', text: 'Orphaned: not referenced by any content (safe to clean up after review).' },
    { key: 'pending_deletion', text: 'Pending deletion: flagged for cleanup; not necessarily deleted yet.' },
    { key: 'physically_deleted', text: 'Physically deleted: removed from hosting; playback will fail and students should not see it.' }
  ]), []);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (videos || []).filter((v) => {
      if (statusFilter !== 'all' && v?.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        v?.title,
        v?.youtubeVideoId,
        v?.originalFilename,
        v?.uploadedBy?.name,
        v?.uploadedBy?.email,
        v?.course?.name,
        v?.section?.name,
        v?.content?.title
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [videos, query, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">YouTube Video Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Admin-only view of all hosted videos (including those backfilled from course content).
            </p>
          </div>

          <button
            type="button"
            onClick={fetchVideos}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="card mb-6">
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            {statusMeaning.map((s) => (
              <div key={s.key}>
                <span className="font-semibold">{s.key}</span>
                <span>: {s.text}</span>
              </div>
            ))}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Note: If a video is not embeddable, the in-app player may show “not allowed to be played in embedded players”.
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, id, uploader, course…"
              className="input-field"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="superseded">superseded</option>
              <option value="orphaned">orphaned</option>
              <option value="pending_deletion">pending_deletion</option>
              <option value="physically_deleted">physically_deleted</option>
            </select>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              {filteredVideos.length} / {videos.length} videos
            </div>
          </div>
        </div>

        {error && (
          <div className="card mb-6 border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10">
            <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Uploaded</th>
                <th className="py-3 pr-4">Uploader</th>
                <th className="py-3 pr-4">Linked Content</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-gray-600 dark:text-gray-300">Loading…</td>
                </tr>
              ) : filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-gray-600 dark:text-gray-300">No videos found.</td>
                </tr>
              ) : (
                filteredVideos.map((v) => {
                  const uploader = v?.uploadedBy?.name || v?.uploadedBy?.email || '—';
                  const linkedTitle = v?.content?.title || '—';
                  const contentId = v?.content?._id || v?.content || null;
                  return (
                    <tr key={v._id} className="text-gray-800 dark:text-gray-100">
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{v?.title || '—'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                          {v?.youtubeVideoId || '—'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {v?.course?.name ? `Course: ${v.course.name}` : null}
                          {v?.section?.name ? ` • Section: ${v.section.name}` : null}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{v?.status || 'active'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Changed: {formatDateTime(v?.statusChangedAt)}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{formatDateTime(v?.uploadedAt || v?.createdAt)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          File: {v?.originalFilename || '—'}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{uploader}</td>
                      <td className="py-3 pr-4">
                        <div>{linkedTitle}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                          {contentId || '—'}
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="btn-secondary inline-flex items-center gap-2"
                            onClick={() => startWatch(v)}
                          >
                            <Eye className="w-4 h-4" />
                            Watch
                          </button>
                          {v?.status === 'physically_deleted' && (
                            <button
                              type="button"
                              className="btn-secondary inline-flex items-center gap-2"
                              onClick={() => removeRecord(v)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-secondary inline-flex items-center gap-2"
                            onClick={() => deleteFromYouTube(v._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete (YouTube + Record)
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {watchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {watchVideo?.title || 'Watch video'}
              </div>
              <button
                type="button"
                onClick={closeWatch}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {watchLoading ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Preparing player…</div>
              ) : (
                <div>
                  <CustomYouTubePlayer
                    youtubeVideoId={watchVideo?.youtubeVideoId}
                    title={watchVideo?.title || ''}
                  />
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0 flex items-center justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={closeWatch}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoLibrary;
