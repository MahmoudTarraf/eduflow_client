import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';

const VerifyError = () => {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Email verification failed. Please try again.';

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <XCircle className="w-20 h-20 text-red-500" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verification Failed
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>

            <div className="space-y-3">
              <Link
                to="/verify-email"
                className="block w-full btn-primary py-3 text-lg font-medium"
              >
                Request New Verification
              </Link>

              <Link
                to="/register"
                className="block w-full btn-secondary py-3 text-lg font-medium"
              >
                Back to Register
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default VerifyError;
