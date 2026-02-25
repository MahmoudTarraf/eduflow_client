import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, FileVideo, CheckCircle, AlertCircle } from 'lucide-react';

const InstructorAgreement = () => {
  const navigate = useNavigate();
  const [agreementText, setAgreementText] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [instructorPercentage, setInstructorPercentage] = useState(80);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [limits, setLimits] = useState({ maxVideoSizeMB: 500 });

  useEffect(() => {
    fetchAgreementText();
    // fetch public limits
    (async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data?.data?.maxVideoSizeMB) {
          setLimits({ maxVideoSizeMB: res.data.data.maxVideoSizeMB });
        }
      } catch (e) { }
    })();
  }, []);

  const fetchAgreementText = async () => {
    try {
      const res = await axios.get('/api/instructor/agreement-text');
      setAgreementText(res.data.data.text);
      setInstructorPercentage(res.data.data.instructorPercentage);
    } catch (error) {
      console.error('Error fetching agreement:', error);
      toast.error('Failed to load agreement text');
    }
  };

  const handleScroll = (e) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 50) {
      setHasScrolledToBottom(true);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid video format. Please upload MP4, MOV, AVI, or WEBM');
      return;
    }

    // Validate file size (dynamic)
    const maxBytes = (limits.maxVideoSizeMB || 500) * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Video size cannot exceed ${limits.maxVideoSizeMB}MB`);
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error('You must agree to the terms to continue');
      return;
    }

    if (!hasScrolledToBottom) {
      toast.error('Please read the entire agreement before submitting');
      return;
    }

    if (!videoFile) {
      toast.error('Please upload your introduction video');
      return;
    }

    let pollInterval;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('agreedToTerms', 'true');
      formData.append('agreementText', agreementText);
      formData.append('agreementVersion', 'v1.0');

      const uploadSessionId = Date.now().toString();
      formData.append('uploadSessionId', uploadSessionId);

      const token = localStorage.getItem('token');

      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/video-upload-jobs/${uploadSessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const job = res.data?.data;
          if (job && typeof job.percent === 'number') {
            setUploadProgress(job.percent);
          }
        } catch (e) { }
      }, 2000);

      const res = await axios.post('/api/instructor/submit-agreement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (progress < 100) {
            setUploadProgress(progress);
          }
        }
      });

      clearInterval(pollInterval);

      toast.success(res.data.message);
      navigate('/instructor/pending-approval');
    } catch (error) {
      console.error('Submit agreement error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit agreement');
    } finally {
      if (pollInterval) clearInterval(pollInterval);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Instructor Agreement
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please read the agreement carefully and submit your introduction video to complete registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agreement Text */}
            <div>
              <label className="label flex items-center justify-between">
                <span>Instructor Agreement</span>
                <span className="text-sm text-gray-500">
                  {hasScrolledToBottom ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Read
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Scroll to bottom
                    </span>
                  )}
                </span>
              </label>
              <div
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 h-80 overflow-y-auto bg-white dark:bg-gray-800"
                onScroll={handleScroll}
              >
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                  {agreementText}
                </pre>
              </div>
            </div>

            {/* Your Percentage Display */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Your Earnings
              </h3>
              <p className="text-primary-700 dark:text-primary-300">
                You will receive <span className="font-bold text-2xl">{instructorPercentage}%</span> of all student payments for your courses.
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                The platform retains {100 - instructorPercentage}% for operational costs and payment processing.
              </p>
            </div>

            {/* I Agree Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreedToTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="agreedToTerms" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                I have read, understood, and agree to the Instructor Agreement. I acknowledge that I must provide high-quality educational content and maintain professional conduct at all times.
              </label>
            </div>

            {/* Video Upload */}
            <div>
              <label className="label">
                Introduction Video (4-6 minutes)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Record a 4-6 minute video introducing yourself, explaining what courses you plan to teach, and discussing your expertise. Max size {limits.maxVideoSizeMB}MB.
              </p>

              {!videoFile ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      MP4, MOV, AVI, or WEBM (Max {limits.maxVideoSizeMB}MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleVideoChange}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileVideo className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{videoFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreview(null);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Video Preview */}
                  {videoPreview && (
                    <div>
                      <label className="label">Preview</label>
                      <video
                        src={videoPreview}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: '400px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!agreedToTerms || !videoFile || uploading || !hasScrolledToBottom}
              >
                {uploading ? 'Submitting...' : 'Submit Agreement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstructorAgreement;
