import { useState } from 'react';
import axios from 'axios';

/**
 * Custom hook for cloud uploads (Cloudinary + YouTube)
 * Handles progress tracking, error handling, and upload state
 */
export const useCloudUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedAsset, setUploadedAsset] = useState(null);

  const rawBase = process.env.REACT_APP_API_URL;
  const apiBase = rawBase
    ? `${String(rawBase).replace(/\/+$/, '')}${String(rawBase).replace(/\/+$/, '').endsWith('/api') ? '' : '/api'}`
    : '/api';

  /**
   * Upload file to Cloudinary (PDFs, images, ZIPs, etc.)
   */
  const uploadFile = async (file, metadata = {}) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadedAsset(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key]);
        }
      });

      const response = await axios.post(
        `${apiBase}/upload/cloudinary`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      setUploadedAsset(response.data.data);
      setUploading(false);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'File upload failed';
      setError(errorMessage);
      setUploading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Upload video to YouTube
   */
  const uploadVideo = async (video, metadata = {}) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadedAsset(null);

    try {
      const formData = new FormData();
      formData.append('video', video);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== null) {
          formData.append(key, metadata[key]);
        }
      });

      const response = await axios.post(
        `${apiBase}/youtube/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      setUploadedAsset(response.data.data);
      setUploading(false);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Video upload failed';
      setError(errorMessage);
      setUploading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Delete file from Cloudinary
   */
  const deleteFile = async (assetId) => {
    try {
      await axios.delete(
        `${apiBase}/upload/cloudinary/${assetId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete file';
      throw new Error(errorMessage);
    }
  };

  /**
   * Delete video from YouTube
   */
  const deleteVideo = async (videoRecordId) => {
    try {
      await axios.delete(
        `${apiBase}/youtube/${videoRecordId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete video';
      throw new Error(errorMessage);
    }
  };

  /**
   * Reset upload state
   */
  const resetUpload = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedAsset(null);
  };

  return {
    uploading,
    progress,
    error,
    uploadedAsset,
    uploadFile,
    uploadVideo,
    deleteFile,
    deleteVideo,
    resetUpload
  };
};

/**
 * Legacy YouTube connect hook removed - platform token handles uploads.
 * Keep signature for backward compatibility but always report connected=true.
 */
export const useYouTubeConnection = () => {
  return {
    connected: true,
    loading: false,
    error: null,
    checkConnection: async () => true,
    getAuthUrl: async () => null,
    disconnect: async () => true
  };
};
