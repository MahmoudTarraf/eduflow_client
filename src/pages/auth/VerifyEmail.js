import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VerifyEmail = () => {
  const { resendVerification } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pendingEmail');
    if (saved) setEmail(saved);
  }, []);

  const onResend = async () => {
    if (!email) return;
    setSending(true);
    await resendVerification(email);
    setSending(false);
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Update localStorage if user changes to a different email
    if (newEmail) {
      localStorage.setItem('pendingEmail', newEmail);
    }
  };

  const handleRegisterAnother = () => {
    // Clear pending email and go to register
    localStorage.removeItem('pendingEmail');
    navigate('/register');
  };

  const handleLoginAnother = () => {
    // Clear pending email and go to login
    localStorage.removeItem('pendingEmail');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
      >
        {/* Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-800 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
          Verify your email
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
          We sent a verification link to your email. Please click the link to complete your registration.
        </p>

        {/* Email Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                className="input-field pl-10 w-full"
                placeholder="your.email@example.com"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
          </div>

          {/* Resend Button */}
          <button 
            onClick={onResend} 
            disabled={!email || sending} 
            className="btn-primary w-full"
          >
            {sending ? 'Sending...' : 'Resend verification link'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>

          {/* Alternative Actions */}
          <div className="space-y-3">
            {/* Register with Another Email */}
            <button
              onClick={handleRegisterAnother}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register With Another Email</span>
            </button>

            {/* Login with Another Account */}
            <button
              onClick={handleLoginAnother}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login With Another Account</span>
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Didn't receive the email? Check your spam folder or resend the verification link.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
