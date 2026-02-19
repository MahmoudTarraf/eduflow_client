import React from 'react';

const PendingApproval = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Instructor approval required</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your email is verified. An admin must approve your instructor request before you can access the instructor dashboard or create courses.
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          You will be able to log in as an instructor once approved.
        </p>
      </div>
    </div>
  );
};

export default PendingApproval;
