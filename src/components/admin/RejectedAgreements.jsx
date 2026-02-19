import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { XCircle, Send, UserX } from 'lucide-react';

const RejectedAgreements = ({ agreements, onUpdate }) => {
  const [showCustomModal, setShowCustomModal] = useState(null);
  const [customPercentages, setCustomPercentages] = useState({
    platformPercentage: 30,
    instructorPercentage: 70
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [sending, setSending] = useState(false);

  const rejectedAgreements = agreements?.filter(a => a.status === 'rejected') || [];

  const handleCreateCustom = async (instructorId) => {
    if (customPercentages.platformPercentage + customPercentages.instructorPercentage !== 100) {
      toast.error('Percentages must sum to 100%');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        '/api/instructor-agreements/create-custom',
        {
          instructorId,
          platformPercentage: customPercentages.platformPercentage,
          instructorPercentage: customPercentages.instructorPercentage,
          adminNotes: adminNotes.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Custom agreement sent to instructor!');
      setShowCustomModal(null);
      setCustomPercentages({ platformPercentage: 30, instructorPercentage: 70 });
      setAdminNotes('');
      
      if (onUpdate) {
        onUpdate(); // Refresh agreements list
      }
    } catch (error) {
      console.error('Error creating custom agreement:', error);
      toast.error(error.response?.data?.message || 'Failed to create custom agreement');
    } finally {
      setSending(false);
    }
  };

  if (rejectedAgreements.length === 0) {
    return null; // Don't show this section if no rejected agreements
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Rejected Agreements
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create custom percentages for these instructors
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {rejectedAgreements.map((agreement) => (
            <div
              key={agreement._id}
              className="border dark:border-gray-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {agreement.instructor?.name || 'Unknown Instructor'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {agreement.instructor?.email}
                      </p>
                    </div>
                  </div>

                  <div className="ml-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Original Offer:</span> Platform {agreement.platformPercentage}% / Instructor {agreement.instructorPercentage}%
                    </p>
                    {agreement.rejectionReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        <span className="font-medium">Reason:</span> {agreement.rejectionReason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Rejected on {new Date(agreement.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCustomModal(agreement.instructor._id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Create Custom</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Agreement Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Custom Agreement
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Set a custom percentage split for this instructor. They will receive a new agreement to approve.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customPercentages.platformPercentage}
                  onChange={(e) => {
                    const platform = parseInt(e.target.value) || 0;
                    setCustomPercentages({
                      platformPercentage: platform,
                      instructorPercentage: 100 - platform
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instructor Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customPercentages.instructorPercentage}
                  onChange={(e) => {
                    const instructor = parseInt(e.target.value) || 0;
                    setCustomPercentages({
                      platformPercentage: 100 - instructor,
                      instructorPercentage: instructor
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {customPercentages.platformPercentage + customPercentages.instructorPercentage !== 100 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ Percentages must sum to 100%
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes or explanation for this custom agreement..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCustomModal(null);
                  setCustomPercentages({ platformPercentage: 30, instructorPercentage: 70 });
                  setAdminNotes('');
                }}
                disabled={sending}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateCustom(showCustomModal)}
                disabled={
                  sending || 
                  customPercentages.platformPercentage + customPercentages.instructorPercentage !== 100
                }
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send Custom Agreement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RejectedAgreements;
