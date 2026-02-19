import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Save, Plus, Trash2, Edit2, FileText, Shield } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../contexts/AuthContext';

const AdminSettings = () => {
  const { user, weakPassword } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentReceivers, setPaymentReceivers] = useState([]);
  const [paymentProviders, setPaymentProviders] = useState([]);
  const [editingReceiver, setEditingReceiver] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [policiesSaving, setPoliciesSaving] = useState(false);
  const [privacyContent, setPrivacyContent] = useState('');
  const [termsContent, setTermsContent] = useState('');

  const providerOptions = Array.isArray(paymentProviders)
    ? paymentProviders.filter(p => p && p.key && p.name && p.isActive !== false)
    : [];

  const [formData, setFormData] = useState({
    paymentMethod: '',
    receiverName: '',
    receiverEmail: '',
    receiverPhone: '',
    receiverLocation: '',
    accountDetails: '',
    isActive: true
  });

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  useEffect(() => {
    fetchSettings();
    fetchPolicies();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/settings/payment-receivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentReceivers(res.data.data || []);
      setPaymentProviders(res.data.providers || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      setPoliciesLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/policies', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const privacy = res.data.data.find(p => p.type === 'privacy');
        const terms = res.data.data.find(p => p.type === 'terms');

        setPrivacyContent(privacy?.content || '');
        setTermsContent(terms?.content || '');
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setPoliciesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddReceiver = () => {
    setShowAddForm(true);
    setEditingReceiver(null);
    setFormData({
      paymentMethod: '',
      receiverName: '',
      receiverEmail: '',
      receiverPhone: '',
      receiverLocation: '',
      accountDetails: '',
      isActive: true
    });
  };

  const handleEditReceiver = (receiver) => {
    const key = receiver.providerKey || receiver.paymentMethod;
    setEditingReceiver(receiver);
    setShowAddForm(true);
    setFormData({
      paymentMethod: key,
      receiverName: receiver.receiverName,
      receiverEmail: receiver.receiverEmail || '',
      receiverPhone: receiver.receiverPhone,
      receiverLocation: receiver.receiverLocation || '',
      accountDetails: receiver.accountDetails || '',
      isActive: receiver.isActive !== false
    });
  };

  const handleDeleteReceiver = async (providerKey) => {
    if (!window.confirm('Are you sure you want to delete this payment receiver?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updatedReceivers = paymentReceivers.filter(r => (r.providerKey || r.paymentMethod) !== providerKey);
      
      await axios.put('/api/admin/settings/payment-receivers', 
        { paymentReceivers: updatedReceivers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentReceivers(updatedReceivers);
      toast.success('Payment receiver deleted successfully');
    } catch (error) {
      console.error('Error deleting receiver:', error);
      toast.error(error.response?.data?.message || 'Failed to delete receiver');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.paymentMethod || !formData.receiverName || !formData.receiverPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const payload = {
        providerKey: formData.paymentMethod,
        paymentMethod: formData.paymentMethod,
        receiverName: formData.receiverName,
        receiverEmail: formData.receiverEmail || '',
        receiverPhone: formData.receiverPhone,
        receiverLocation: formData.receiverLocation || '',
        accountDetails: formData.accountDetails || '',
        isActive: formData.isActive
      };

      let updatedReceivers;
      if (editingReceiver) {
        const editingKey = editingReceiver.providerKey || editingReceiver.paymentMethod;
        // Update existing receiver
        updatedReceivers = paymentReceivers.map(r =>
          (r.providerKey || r.paymentMethod) === editingKey ? payload : r
        );
      } else {
        // Check if payment method already exists
        if (paymentReceivers.some(r => (r.providerKey || r.paymentMethod) === formData.paymentMethod)) {
          toast.error('Payment method already has a receiver configured');
          return;
        }
        // Add new receiver
        updatedReceivers = [...paymentReceivers, payload];
      }

      await axios.put('/api/admin/settings/payment-receivers',
        { paymentReceivers: updatedReceivers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentReceivers(updatedReceivers);
      setShowAddForm(false);
      setEditingReceiver(null);
      setFormData({
        paymentMethod: '',
        receiverName: '',
        receiverEmail: '',
        receiverPhone: '',
        receiverLocation: '',
        accountDetails: '',
        isActive: true
      });
      toast.success(editingReceiver ? 'Receiver updated successfully' : 'Receiver added successfully');
    } catch (error) {
      console.error('Error saving receiver:', error);
      toast.error(error.response?.data?.message || 'Failed to save receiver');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicies = async () => {
    try {
      setPoliciesSaving(true);
      const token = localStorage.getItem('token');

      await Promise.all([
        axios.put(
          '/api/policies/privacy',
          { content: privacyContent },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.put(
          '/api/policies/terms',
          { content: termsContent },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      toast.success('Policies updated successfully');
    } catch (error) {
      console.error('Error saving policies:', error);
      toast.error(error.response?.data?.message || 'Failed to save policies');
    } finally {
      setPoliciesSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage platform settings and payment receivers</p>
        </div>

        {/* Security Settings callout */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded">
              <Shield className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <div className="font-semibold text-indigo-900 dark:text-indigo-200">Security Settings</div>
              <div className="text-sm text-indigo-800/80 dark:text-indigo-200/80">Manage Two-Factor Authentication (2FA) and trusted devices</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/security" className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Manage 2FA</Link>
            <Link to="/security/devices" className="px-3 py-2 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30">Trusted Devices</Link>
          </div>
        </div>

        {/* Payment Receivers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Receivers</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure receiver information for each payment method
              </p>
            </div>
            <button
              onClick={handleAddReceiver}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Receiver
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingReceiver ? 'Edit Payment Receiver' : 'Add Payment Receiver'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    disabled={!!editingReceiver}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    required
                  >
                    <option value="">Select payment method</option>
                    {providerOptions.length > 0 ? (
                      providerOptions.map((p) => (
                        <option key={p.key} value={p.key}>{p.name}</option>
                      ))
                    ) : (
                      <option value="other">Other</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Receiver Name *
                  </label>
                  <input
                    type="text"
                    name="receiverName"
                    value={formData.receiverName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="receiverEmail"
                    value={formData.receiverEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="receiverPhone"
                    value={formData.receiverPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="receiverLocation"
                    value={formData.receiverLocation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Details
                  </label>
                  <textarea
                    name="accountDetails"
                    value={formData.accountDetails}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Bank account number, IBAN, or other relevant details"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingReceiver(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* Receivers List */}
          <div className="space-y-4">
            {paymentReceivers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No payment receivers configured. Click "Add Receiver" to get started.
              </div>
            ) : (
              paymentReceivers.map((receiver) => (
                <div
                  key={receiver._id || receiver.providerKey || receiver.paymentMethod}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {providerOptions.find(p => p.key === (receiver.providerKey || receiver.paymentMethod))?.name || (receiver.providerKey || receiver.paymentMethod)}
                        </h3>
                        {receiver.isActive !== false && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Name:</span> {receiver.receiverName}
                        </div>
                        {receiver.receiverEmail && (
                          <div>
                            <span className="font-medium">Email:</span> {receiver.receiverEmail}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Phone:</span> {receiver.receiverPhone}
                        </div>
                        {receiver.receiverLocation && (
                          <div>
                            <span className="font-medium">Location:</span> {receiver.receiverLocation}
                          </div>
                        )}
                        {receiver.accountDetails && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Account:</span> {receiver.accountDetails}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditReceiver(receiver)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReceiver(receiver.providerKey || receiver.paymentMethod)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legal Policies Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Legal Policies</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage the Privacy Policy and Terms of Service shown to students before registration.
                </p>
              </div>
            </div>
          </div>

          {policiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Privacy &amp; Policy (HTML)
                  </label>
                  <div className="bg-white dark:bg-gray-700 rounded-md quill-editor-dark">
                    <ReactQuill
                      theme="snow"
                      value={privacyContent}
                      onChange={setPrivacyContent}
                      modules={quillModules}
                      className="dark:text-white"
                      style={{ minHeight: '200px' }}
                    />
                    <style>{`
                      .quill-editor-dark .ql-toolbar {
                        background: white;
                        border-color: #d1d5db;
                      }
                      .dark .quill-editor-dark .ql-toolbar {
                        background: #374151;
                        border-color: #4b5563;
                      }
                      .dark .quill-editor-dark .ql-stroke {
                        stroke: #e5e7eb;
                      }
                      .dark .quill-editor-dark .ql-fill {
                        fill: #e5e7eb;
                      }
                      .dark .quill-editor-dark .ql-picker-label {
                        color: #e5e7eb;
                      }
                      .dark .quill-editor-dark .ql-picker-options {
                        background: #374151;
                        border-color: #4b5563;
                      }
                      .dark .quill-editor-dark .ql-picker-item {
                        color: #e5e7eb;
                      }
                      .dark .quill-editor-dark .ql-editor {
                        background: #1f2937;
                        color: #e5e7eb;
                      }
                    `}</style>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms of Service (HTML)
                  </label>
                  <div className="bg-white dark:bg-gray-700 rounded-md quill-editor-dark">
                    <ReactQuill
                      theme="snow"
                      value={termsContent}
                      onChange={setTermsContent}
                      modules={quillModules}
                      className="dark:text-white"
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleSavePolicies}
                  disabled={policiesSaving}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {policiesSaving ? 'Saving...' : 'Save Policies'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
