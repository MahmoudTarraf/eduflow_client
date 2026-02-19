import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const AdminCertificateManagement = () => {
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState({
    requested: [],
    issued: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [activeTab, setActiveTab] = useState('requested');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);

  useEffect(() => {
    fetchAllCertificateRequests();
  }, []);

  const fetchAllCertificateRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all statuses in parallel
      const [requestedRes, issuedRes, rejectedRes] = await Promise.all([
        axios.get('/api/certificates/requests', {
          params: { status: 'requested' },
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { requests: [] } })),
        axios.get('/api/certificates/requests', {
          params: { status: 'issued' },
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { requests: [] } })),
        axios.get('/api/certificates/requests', {
          params: { status: 'rejected' },
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { requests: [] } }))
      ]);
      
      setAllRequests({
        requested: requestedRes.data.requests || [],
        issued: issuedRes.data.requests || [],
        rejected: rejectedRes.data.requests || []
      });
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      toast.error('Failed to fetch certificate requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      if (!certificateFile) {
        toast.error('Please select a certificate file');
        return;
      }
      
      formData.append('certificate', certificateFile);
      
      const res = await axios.post(`/api/certificates/${requestId}/approve`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(res.data.message);
      fetchAllCertificateRequests();
      setSelectedRequest(null);
      setCertificateFile(null);
    } catch (error) {
      console.error('Error approving certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to approve certificate');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
      
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/certificates/${requestId}/reject`, {
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(res.data.message);
      fetchAllCertificateRequests();
    } catch (error) {
      console.error('Error rejecting certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to reject certificate');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this certificate request?')) {
      return;
    }
    
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'deleting' }));
      
      const token = localStorage.getItem('token');
      await axios.delete(`/api/certificates/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Certificate request deleted');
      fetchAllCertificateRequests();
    } catch (error) {
      console.error('Error deleting certificate request:', error);
      toast.error(error.response?.data?.message || 'Failed to delete certificate request');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const filteredRequests = allRequests[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Certificate Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage all student certificate requests
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {['requested', 'issued', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab} ({allRequests[tab]?.length || 0})
              </button>
            ))}
          </nav>
        </div>

        {/* Certificate Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <svg className="animate-spin mx-auto h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading certificate requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No {activeTab} certificates
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {activeTab === 'requested' 
                  ? 'There are no pending certificate requests.' 
                  : `There are no ${activeTab} certificates.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequests.map((request) => (
                <div key={request._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {request.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.student?.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {request.course?.name} • Grade: {request.courseGrade}%
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Requested on: {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {activeTab === 'requested' ? (
                        <>
                          <button
                            onClick={() => setSelectedRequest(selectedRequest === request._id ? null : request._id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
                          >
                            {selectedRequest === request._id ? 'Cancel' : 'Approve'}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason !== null) {
                                handleReject(request._id, reason);
                              }
                            }}
                            disabled={processing[request._id]}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 focus:outline-none"
                          >
                            Reject
                          </button>
                        </>
                      ) : activeTab === 'issued' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Rejected
                        </span>
                      )}
                      
                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(request._id)}
                          disabled={processing[request._id]}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 focus:outline-none"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Approval Form */}
                  {selectedRequest === request._id && activeTab === 'requested' && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        Upload Certificate
                      </h4>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept=".rar"
                          onChange={(e) => setCertificateFile(e.target.files[0])}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100
                            dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                        />
                        <button
                          onClick={() => handleApprove(request._id)}
                          disabled={processing[request._id] || !certificateFile}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 focus:outline-none flex items-center"
                        >
                          {processing[request._id] === 'approving' ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          Confirm
                        </button>
                      </div>
                      {certificateFile && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          Selected file: {certificateFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCertificateManagement;
