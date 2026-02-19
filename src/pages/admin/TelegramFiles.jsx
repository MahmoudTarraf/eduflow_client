import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, Edit3, RefreshCw, Trash2, X } from 'lucide-react';

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

const formatBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let value = n;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const digits = idx === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[idx]}`;
};

const TelegramFiles = () => {
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 100 });
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    fileName: '',
    fileSize: '',
    telegramFileId: '',
    telegramMessageId: '',
    telegramChatId: '',
    downloadOverrideUrl: ''
  });
  const [editSaving, setEditSaving] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await axios.get('/api/admin/telegram-files/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res?.data?.data || null);
    } catch (e) {
      console.error('Failed to load Telegram summary:', e);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  const fetchFiles = useCallback(
    async (next = {}) => {
      try {
        setLoading(true);
        setError('');

        const res = await axios.get('/api/admin/telegram-files', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: next.status ?? statusFilter,
            q: next.q ?? query,
            page: next.page ?? meta.page,
            limit: next.limit ?? meta.limit
          }
        });

        setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
        setMeta(res?.data?.meta || { total: 0, page: 1, limit: 100 });
      } catch (e) {
        console.error('Failed to load Telegram files:', e);
        setError(e?.response?.data?.message || 'Failed to load files');
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [token, statusFilter, query, meta.page, meta.limit]
  );

  useEffect(() => {
    fetchSummary();
    fetchFiles();
  }, [fetchFiles, fetchSummary]);

  const openEdit = useCallback((record) => {
    const r = record || null;
    setEditRecord(r);
    setEditForm({
      fileName: r?.fileName || '',
      fileSize: r?.fileSize ?? '',
      telegramFileId: r?.telegramFileId || '',
      telegramMessageId: r?.telegramMessageId ?? '',
      telegramChatId: r?.telegramChatId || '',
      downloadOverrideUrl: r?.downloadOverrideUrl || ''
    });
    setEditOpen(true);
    setEditSaving(false);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditRecord(null);
    setEditSaving(false);
  }, []);

  const saveEdit = useCallback(async () => {
    const id = editRecord?._id;
    if (!id) return;

    try {
      setEditSaving(true);
      const payload = {
        fileName: editForm.fileName,
        fileSize: editForm.fileSize,
        telegramFileId: editForm.telegramFileId,
        telegramMessageId: editForm.telegramMessageId,
        telegramChatId: editForm.telegramChatId,
        downloadOverrideUrl: editForm.downloadOverrideUrl
      };

      const res = await axios.patch(`/api/admin/telegram-files/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('File updated');
      const updated = res?.data?.data;
      if (updated?._id) {
        setRows((prev) => (prev || []).map((r) => (r?._id === updated._id ? updated : r)));
      }
      closeEdit();
    } catch (e) {
      console.error('Failed to update Telegram file:', e);
      toast.error(e?.response?.data?.message || 'Failed to update file');
      setEditSaving(false);
    }
  }, [editRecord, editForm, token, closeEdit]);

  const softDelete = useCallback(
    async (record) => {
      const id = record?._id;
      if (!id) return;
      if (!window.confirm('Soft delete this record? This hides linked content and preserves audit history.')) {
        return;
      }

      try {
        const res = await axios.post(`/api/admin/telegram-files/${id}/soft-delete`, null, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Soft deleted');
        const updated = res?.data?.data;
        if (updated?._id) {
          setRows((prev) => (prev || []).map((r) => (r?._id === updated._id ? updated : r)));
        } else {
          await fetchFiles();
        }
        await fetchSummary();
      } catch (e) {
        console.error('Soft delete failed:', e);
        toast.error(e?.response?.data?.message || 'Failed to soft delete');
      }
    },
    [token, fetchFiles, fetchSummary]
  );

  const physicalDelete = useCallback(
    async (record) => {
      const id = record?._id;
      if (!id) return;
      if (!window.confirm('Physically delete this file from Telegram? This action cannot be undone.')) {
        return;
      }

      try {
        const res = await axios.delete(`/api/admin/telegram-files/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(res?.data?.message || 'Deleted');
        const updated = res?.data?.data;
        if (updated?._id) {
          setRows((prev) => (prev || []).map((r) => (r?._id === updated._id ? updated : r)));
        } else {
          await fetchFiles();
        }
        await fetchSummary();
      } catch (e) {
        console.error('Physical delete failed:', e);
        toast.error(e?.response?.data?.message || 'Failed to delete');
      }
    },
    [token, fetchFiles, fetchSummary]
  );

  const download = useCallback(
    async (record) => {
      if (!record) return;
      const id = record?._id;
      if (!id) return;

      const overrideUrl = typeof record.downloadOverrideUrl === 'string' ? record.downloadOverrideUrl.trim() : '';
      if (overrideUrl) {
        window.open(overrideUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      try {
        const res = await axios.get(`/api/admin/telegram-files/${id}/download`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        const blob = res?.data instanceof Blob ? res.data : new Blob([res?.data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = record?.fileName || 'file';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Download failed:', e);
        toast.error(e?.response?.data?.message || 'Failed to download');
      }
    },
    [token]
  );

  const counts = summary?.counts || null;
  const bot = summary?.bot || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Telegram Files</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Admin-only view of all files uploaded to Telegram, with full audit and lifecycle actions.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await fetchSummary();
              await fetchFiles();
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100"
            disabled={loading || summaryLoading}
          >
            <RefreshCw className={`w-4 h-4 ${(loading || summaryLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="card mb-6">
          {summaryLoading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Loading summary…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100">Counts</div>
                <div className="text-gray-600 dark:text-gray-300">Total: {counts?.total ?? '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Active: {counts?.active ?? '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Soft deleted: {counts?.softDeleted ?? '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Changed: {counts?.changed ?? '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Deleted: {counts?.deleted ?? '—'}</div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100">Bot status</div>
                <div className="text-gray-600 dark:text-gray-300">Token configured: {bot?.tokenConfigured ? 'yes' : 'no'}</div>
                <div className="text-gray-600 dark:text-gray-300">Channel configured: {bot?.channelConfigured ? 'yes' : 'no'}</div>
                <div className="text-gray-600 dark:text-gray-300">Token status: {bot?.tokenStatus || '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Checked at: {formatDateTime(bot?.checkedAt)}</div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100">Identity & permissions</div>
                <div className="text-gray-600 dark:text-gray-300">Bot: {bot?.bot?.username ? `@${bot.bot.username}` : '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Bot id: {bot?.bot?.id ?? '—'}</div>
                <div className="text-gray-600 dark:text-gray-300">Can delete messages: {bot?.permissions?.canDeleteMessages ? 'yes' : 'no'}</div>
                <div className="text-gray-600 dark:text-gray-300">Can manage chat: {bot?.permissions?.canManageChat ? 'yes' : 'no'}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, telegram id…"
              className="input-field"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All statuses</option>
              <option value="active">active</option>
              <option value="soft_deleted">soft_deleted</option>
              <option value="changed">changed</option>
              <option value="deleted">deleted</option>
            </select>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fetchFiles({ page: 1 })}
                className="btn-primary"
                disabled={loading}
              >
                Apply
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {rows.length} / {meta.total} files
              </div>
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
                <th className="py-3 pr-4">File</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Uploaded</th>
                <th className="py-3 pr-4">Uploader</th>
                <th className="py-3 pr-4">Context</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-gray-600 dark:text-gray-300">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-gray-600 dark:text-gray-300">No files found.</td>
                </tr>
              ) : (
                rows.map((r) => {
                  const uploader = r?.uploadedBy?.name || r?.uploadedBy?.email || '—';
                  const course = r?.course?.name || '—';
                  const group = r?.group?.name || '—';
                  const section = r?.section?.name || '—';
                  const linkedTitle = r?.content?.title || '—';

                  return (
                    <tr key={r._id} className="text-gray-800 dark:text-gray-100">
                      <td className="py-3 pr-4">
                        <div className="font-semibold break-words">{r?.fileName || '—'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Size: {formatBytes(r?.fileSize)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                          Telegram file id: {r?.telegramFileId || '—'}
                        </div>
                        {r?.downloadOverrideUrl ? (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 break-all">
                            Override: {r.downloadOverrideUrl}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{r?.status || 'active'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Changed: {formatDateTime(r?.statusChangedAt)}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{formatDateTime(r?.uploadedAt || r?.createdAt)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Type: {r?.contentType || '—'}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{uploader}</td>
                      <td className="py-3 pr-4">
                        <div className="text-xs text-gray-600 dark:text-gray-300">Course: {course}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">Group: {group}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">Section: {section}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Content: {linkedTitle}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                          {r?.content?._id || r?.content || '—'}
                        </div>
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => download(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-xs dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-xs dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => softDelete(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 dark:text-amber-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Soft
                          </button>
                          <button
                            type="button"
                            onClick={() => physicalDelete(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">Edit Telegram File</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                  {editRecord?._id}
                </div>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">File name</div>
                <input
                  value={editForm.fileName}
                  onChange={(e) => setEditForm((p) => ({ ...p, fileName: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">File size (bytes)</div>
                <input
                  value={editForm.fileSize}
                  onChange={(e) => setEditForm((p) => ({ ...p, fileSize: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Telegram file id</div>
                <input
                  value={editForm.telegramFileId}
                  onChange={(e) => setEditForm((p) => ({ ...p, telegramFileId: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Telegram chat id</div>
                <input
                  value={editForm.telegramChatId}
                  onChange={(e) => setEditForm((p) => ({ ...p, telegramChatId: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Telegram message id</div>
                <input
                  value={editForm.telegramMessageId}
                  onChange={(e) => setEditForm((p) => ({ ...p, telegramMessageId: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Download override URL</div>
                <input
                  value={editForm.downloadOverrideUrl}
                  onChange={(e) => setEditForm((p) => ({ ...p, downloadOverrideUrl: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="btn-secondary"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="btn-primary"
                disabled={editSaving}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramFiles;
