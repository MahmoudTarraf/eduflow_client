import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  History,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const InstructorAgreementsManagement = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedInstructor, setExpandedInstructor] = useState(null);
  const [signupAgreementsByInstructorId, setSignupAgreementsByInstructorId] = useState({});
  const [showCreateCustomModal, setShowCreateCustomModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [customPercentages, setCustomPercentages] = useState({
    platformPercentage: 30,
    instructorPercentage: 70,
    adminNotes: ''
  });
  const [creating, setCreating] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [agreementPreview, setAgreementPreview] = useState({
    text: '',
    instructorPercentage: 70,
    platformPercentage: 30
  });
  const [loadingAgreementPreview, setLoadingAgreementPreview] = useState(false);
  const [pendingSummary, setPendingSummary] = useState({ agreements: 0, rejectedAgreementsLastReadAt: null });
  const [markingRejectedRead, setMarkingRejectedRead] = useState(false);

  useEffect(() => {
    fetchAgreements();
    fetchInstructors();
    fetchSignupAgreements();
    fetchPendingSummary();
  }, [filterStatus]);

  useEffect(() => {
    fetchAgreementPreview();
  }, []);

  const isUnreadRejectedAgreement = (agreement) => {
    if (!agreement || agreement.status !== 'rejected') return false;

    const lastReadAt = pendingSummary?.rejectedAgreementsLastReadAt
      ? new Date(pendingSummary.rejectedAgreementsLastReadAt).getTime()
      : null;

    if (!lastReadAt) return true;

    const rejectedAt = agreement.rejectedAt ? new Date(agreement.rejectedAt).getTime() : null;
    // Be conservative: if we can't read rejectedAt but the record is rejected, treat it as unread
    if (!rejectedAt) return true;

    return rejectedAt > lastReadAt;
  };

  const fetchPendingSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/pending-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data || {};
      setPendingSummary({
        agreements: data.agreements || 0,
        rejectedAgreementsLastReadAt: data.rejectedAgreementsLastReadAt || null
      });
    } catch (error) {
      console.error('Error fetching pending summary:', error);
    }
  };

  const handleMarkRejectedAgreementsRead = async () => {
    try {
      setMarkingRejectedRead(true);
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/admin/settings/rejected-agreements/mark-read',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Rejected agreements marked as read');
      await fetchPendingSummary();
    } catch (error) {
      console.error('Error marking rejected agreements as read:', error);
      toast.error('Failed to mark rejected agreements as read');
    } finally {
      setMarkingRejectedRead(false);
    }
  };

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = filterStatus ? `?status=${filterStatus}` : '';
      
      const response = await axios.get(`/api/instructor-agreements${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAgreements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/instructors?limit=1000&includeDeleted=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInstructors(response.data.instructors || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchSignupAgreements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/instructor/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = response.data?.data || [];
      const nextMap = {};
      list.forEach((a) => {
        const instructorId = a?.instructor?._id;
        if (instructorId) {
          nextMap[instructorId] = a;
        }
      });

      setSignupAgreementsByInstructorId(nextMap);
    } catch (error) {
      console.error('Error fetching signup agreements:', error);
    }
  };

  const fetchAgreementPreview = async () => {
    try {
      setLoadingAgreementPreview(true);
      const response = await axios.get('/api/instructor/agreement-text');
      if (response.data?.success && response.data.data) {
        setAgreementPreview({
          text: response.data.data.text,
          instructorPercentage: response.data.data.instructorPercentage,
          platformPercentage: response.data.data.adminPercentage
        });
      }
    } catch (error) {
      console.error('Error fetching agreement preview:', error);
    } finally {
      setLoadingAgreementPreview(false);
    }
  };

  const handleCreateCustomAgreement = async () => {
    if (!selectedInstructor) {
      toast.error('Please select an instructor');
      return;
    }

    if (customPercentages.platformPercentage + customPercentages.instructorPercentage !== 100) {
      toast.error('Percentages must sum to 100%');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      const isAllInstructors = selectedInstructor === 'ALL';

      if (isAllInstructors) {
        await axios.post('/api/instructor-agreements/update-global-settings', {
          platformPercentage: customPercentages.platformPercentage,
          instructorPercentage: customPercentages.instructorPercentage,
          includeCustomInstructors: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Global earnings settings updated and agreements sent to all approved instructors');
      } else {
        await axios.post('/api/instructor-agreements/create-custom', {
          instructorId: selectedInstructor,
          platformPercentage: customPercentages.platformPercentage,
          instructorPercentage: customPercentages.instructorPercentage,
          adminNotes: customPercentages.adminNotes
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Custom agreement created and sent to instructor');
      }
      setShowCreateCustomModal(false);
      setSelectedInstructor(null);
      setCustomPercentages({
        platformPercentage: 30,
        instructorPercentage: 70,
        adminNotes: ''
      });
      fetchAgreements();
    } catch (error) {
      console.error('Error creating custom agreement:', error);
      toast.error(error.response?.data?.message || 'Failed to create agreement');
    } finally {
      setCreating(false);
    }
  };

  const handlePercentageChange = (field, value) => {
    const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
    const otherField = field === 'platformPercentage' ? 'instructorPercentage' : 'platformPercentage';
    
    setCustomPercentages(prev => ({
      ...prev,
      [field]: numValue,
      [otherField]: 100 - numValue
    }));
  };

  const toggleInstructorExpansion = (instructorId) => {
    setExpandedInstructor(expandedInstructor === instructorId ? null : instructorId);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: Clock },
      approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: XCircle },
      expired: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-400', icon: History }
    };
    return badges[status] || badges.pending;
  };

  const getAgreementTypeBadge = (type) => {
    const badges = {
      custom: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      global: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const groupedAgreements = (() => {
    const acc = {};

    const upsert = (instructor) => {
      const instructorId = instructor?._id;
      if (!instructorId) return;
      if (!acc[instructorId]) {
        acc[instructorId] = {
          instructor,
          agreements: []
        };
      }
    };

    (instructors || []).forEach((inst) => upsert(inst));

    (agreements || []).forEach((agreement) => {
      const instructorId = agreement?.instructor?._id;
      if (!instructorId) return;
      upsert(agreement.instructor);
      acc[instructorId].agreements.push(agreement);
    });

    Object.values(signupAgreementsByInstructorId || {}).forEach((signupAgreement) => {
      if (signupAgreement?.instructor?._id) {
        upsert(signupAgreement.instructor);
      }
    });

    Object.values(acc).forEach((group) => {
      group.agreements.sort((a, b) => (b.version || 0) - (a.version || 0));
    });

    return acc;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {pendingSummary.agreements > 0 && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-300 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                  {pendingSummary.agreements} rejected earnings agreement{pendingSummary.agreements === 1 ? '' : 's'} need review
                </p>
                <p className="text-xs text-red-800/80 dark:text-red-200/80">
                  These are counted in the Admin dashboard pending actions strip until you mark them as read.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setFilterStatus('rejected')}
                className="px-4 py-2 rounded-md bg-white/80 dark:bg-gray-900/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-medium hover:bg-white dark:hover:bg-gray-900"
              >
                Show rejected
              </button>
              <button
                type="button"
                onClick={handleMarkRejectedAgreementsRead}
                disabled={markingRejectedRead || pendingSummary.agreements === 0}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {markingRejectedRead ? 'Marking...' : 'Mark rejected agreements as read'}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Instructor Agreements Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage earnings agreements with version tracking
            </p>
          </div>
          <button
            onClick={() => setShowCreateCustomModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Agreement
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['', 'pending', 'approved', 'rejected', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>

        {/* Agreements List - Grouped by Instructor */}
        <div className="space-y-4">
          {Object.values(groupedAgreements)
            .sort((a, b) => {
              const aUnread = (a.agreements || []).filter(isUnreadRejectedAgreement).length;
              const bUnread = (b.agreements || []).filter(isUnreadRejectedAgreement).length;

              if (bUnread !== aUnread) return bUnread - aUnread;
              return String(a?.instructor?.name || '').localeCompare(String(b?.instructor?.name || ''));
            })
            .map(({ instructor, agreements: instructorAgreements }) => {
            const activeAgreement = instructorAgreements.find(a => a.isActive && a.status === 'approved');
            const unreadRejectedCount = instructorAgreements.filter(isUnreadRejectedAgreement).length;
            const isExpanded = expandedInstructor === instructor._id;
            const signupAgreement = signupAgreementsByInstructorId?.[instructor._id] || null;
            const isSignupActive = Boolean(signupAgreement) && signupAgreement.status === 'approved' && !activeAgreement;

            return (
              <div key={instructor._id} className="card">
                {/* Instructor Header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleInstructorExpansion(instructor._id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {instructor.name}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {instructor.email}
                        </span>
                        {(instructor.isDeleted || instructor.status === 'deleted') && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Deleted Instructor
                          </span>
                        )}
                        {unreadRejectedCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
                            {unreadRejectedCount} REJECTED NEED REVIEW
                          </span>
                        )}
                      </div>
                      {activeAgreement && (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Active: {activeAgreement.instructorPercentage}% Instructor / {activeAgreement.platformPercentage}% Platform
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgreementTypeBadge(activeAgreement.agreementType)}`}>
                            {activeAgreement.agreementType} v{activeAgreement.version}
                          </span>
                        </div>
                      )}
                      {signupAgreement && (
                        <div className="flex items-center space-x-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Signup Agreement:</span>
                          {isSignupActive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              ACTIVE
                            </span>
                          )}
                          <span className="uppercase">{signupAgreement.status}</span>
                          {signupAgreement?.instructor?.agreementPdfUrl && (
                            <a
                              href={signupAgreement.instructor.agreementPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {instructorAgreements.length} agreement{instructorAgreements.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Latest: v{Math.max(...instructorAgreements.map(a => a.version || 1))}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Agreement Version History */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {signupAgreement && (
                      <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Signup Agreement</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                              Status: <span className="uppercase">{signupAgreement.status}</span>
                              {isSignupActive && (
                                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  ACTIVE
                                </span>
                              )}
                            </p>
                            {signupAgreement.agreementText && (
                              <div className="max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-3">
                                <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200 font-sans">
                                  {signupAgreement.agreementText}
                                </pre>
                              </div>
                            )}
                          </div>
                          {signupAgreement?.instructor?.agreementPdfUrl && (
                            <a
                              href={signupAgreement.instructor.agreementPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="btn-secondary text-sm flex items-center ml-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <History className="w-4 h-4 mr-2" />
                      Agreement Version History
                    </h4>
                    <div className="space-y-3">
                      {instructorAgreements.length === 0 && (
                        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
                          No earnings agreements found for this instructor.
                        </div>
                      )}
                      {instructorAgreements.map((agreement, index) => {
                        const badge = getStatusBadge(agreement.status);
                        const Icon = badge.icon;

                        return (
                          <div
                            key={agreement._id}
                            className={`p-4 rounded-lg border-2 ${
                              agreement.isActive && agreement.status === 'approved'
                                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    Version {agreement.version || 1}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgreementTypeBadge(agreement.agreementType)}`}>
                                    {agreement.agreementType}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${badge.bg} ${badge.text}`}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {String(agreement.status || '').toUpperCase()}
                                  </span>
                                  {agreement.isActive && agreement.status === 'approved' && (
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
                                      CURRENTLY ACTIVE
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Instructor Share</p>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {agreement.instructorPercentage}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Platform Share</p>
                                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                      {agreement.platformPercentage}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {new Date(agreement.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {agreement.approvedAt && (
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(agreement.approvedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {agreement.adminNotes && (
                                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Admin Notes:</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{agreement.adminNotes}</p>
                                  </div>
                                )}

                                {agreement.status === 'rejected' && agreement.rejectionReason && (
                                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Rejection Reason:</p>
                                    <p className="text-sm text-red-800 dark:text-red-200">{agreement.rejectionReason}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col space-y-2 ml-4">
                                {agreement.pdfUrl && (
                                  <a
                                    href={agreement.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="btn-secondary text-sm flex items-center"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </a>
                                )}
                                {agreement.status === 'rejected' && (
                                  <button
                                    onClick={() => {
                                      setSelectedInstructor(instructor._id);
                                      setShowCreateCustomModal(true);
                                    }}
                                    className="btn-primary text-sm flex items-center whitespace-nowrap"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Make New Agreement
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(groupedAgreements).length === 0 && (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No agreements found
                {filterStatus && ` with status "${filterStatus}"`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Custom Agreement Modal */}
      {showCreateCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Custom Agreement
              </h3>
              <button
                onClick={() => {
                  setShowCreateCustomModal(false);
                  setSelectedInstructor(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Instructor Selection */}
              <div>
                <label className="label">Select Instructor</label>
                <select
                  className="input-field"
                  value={selectedInstructor || ''}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                >
                  <option value="">Choose an instructor...</option>
                  <option value="ALL">All instructors (update global agreement and send to all)</option>
                  {instructors
                    .filter((instructor) => !instructor.isDeleted && instructor.status !== 'deleted')
                    .map((instructor) => (
                      <option key={instructor._id} value={instructor._id}>
                        {instructor.name} ({instructor.email})
                      </option>
                    ))}
                </select>
              </div>

              {/* Percentage Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Platform Percentage (%)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={customPercentages.platformPercentage}
                    onChange={(e) => handlePercentageChange('platformPercentage', e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="label">Instructor Percentage (%)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={customPercentages.instructorPercentage}
                    onChange={(e) => handlePercentageChange('instructorPercentage', e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Percentage Validation */}
              <div className={`p-3 rounded-lg ${
                customPercentages.platformPercentage + customPercentages.instructorPercentage === 100
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
              }`}>
                <p className={`text-sm ${
                  customPercentages.platformPercentage + customPercentages.instructorPercentage === 100
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  Total: {customPercentages.platformPercentage + customPercentages.instructorPercentage}% 
                  {customPercentages.platformPercentage + customPercentages.instructorPercentage === 100 ? ' ✓' : ' (must equal 100%)'}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="label">Admin Notes (Optional)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={customPercentages.adminNotes}
                  onChange={(e) => setCustomPercentages({ ...customPercentages, adminNotes: e.target.value })}
                  placeholder="Internal notes about this custom agreement..."
                />
              </div>

              {/* Agreement Text Preview */}
              <div>
                <label className="label">Agreement Text Preview</label>
                <div className="max-h-60 overflow-y-auto p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {loadingAgreementPreview
                    ? 'Loading agreement text...'
                    : (agreementPreview.text || 'No agreement text configured yet. You can set it in Agreement Settings.')}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">This will:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Generate a new PDF agreement with custom percentages</li>
                      <li>Send it to the instructor via email</li>
                      <li>Create a new version number automatically</li>
                      <li>Once approved, future payments will use this percentage</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateCustomModal(false);
                  setSelectedInstructor(null);
                }}
                className="btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomAgreement}
                className="btn-primary"
                disabled={creating || !selectedInstructor || customPercentages.platformPercentage + customPercentages.instructorPercentage !== 100}
              >
                {creating ? 'Creating...' : 'Create & Send Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAgreementsManagement;
