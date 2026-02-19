import React, { useEffect, useState } from 'react';
import { useYouTubeConnection } from '../hooks/useCloudUpload';
import toast from 'react-hot-toast';

/**
 * YouTube Connection Component
 * Allows instructors to connect their YouTube account for video uploads
 */
const YouTubeConnect = () => {
  const { connected, loading, checkConnection, getAuthUrl, disconnect } = useYouTubeConnection();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkConnection();

    // Check for OAuth callback success/error
    const urlParams = new URLSearchParams(window.location.search);
    const youtubeStatus = urlParams.get('youtube');
    
    if (youtubeStatus === 'success') {
      toast.success('Video hosting connected successfully!');
      checkConnection();
      // Remove query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (youtubeStatus === 'error') {
      toast.error('Failed to connect video hosting. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const authUrl = await getAuthUrl();
      // Redirect to provider OAuth page
      window.location.href = authUrl;
    } catch (error) {
      toast.error(error.message);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect video hosting? You will need to reconnect to upload videos.')) {
      return;
    }

    try {
      await disconnect();
      toast.success('Video hosting disconnected successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Checking video hosting connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${connected ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Video Hosting Integration
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {connected 
                  ? '✅ Your video hosting is connected. You can now upload videos.'
                  : '❌ Connect video hosting to enable video uploads.'}
              </p>
            </div>
          </div>

          {connected && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Benefits
                  </h4>
                  <ul className="mt-2 text-sm text-green-700 list-disc list-inside space-y-1">
                    <li>Unlimited video storage</li>
                    <li>Global CDN delivery</li>
                    <li>Automatic video processing & transcoding</li>
                    <li>Built-in analytics and engagement metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!connected && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    How to Connect
                  </h4>
                  <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
                    <li>Click "Connect" below</li>
                    <li>Sign in with your account</li>
                    <li>Grant permissions to upload videos</li>
                    <li>You'll be redirected back here</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-6 flex-shrink-0">
          {connected ? (
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                  Connect
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeConnect;
