import React from 'react';
import { motion } from 'framer-motion';

const NoDataIllustration = ({ message = "No courses available", description = "No data found. Try adjusting your search criteria." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated SVG Illustration */}
      <motion.svg
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="mb-6"
      >
        {/* Background Circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="currentColor"
          className="text-gray-100 dark:text-gray-800"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        
        {/* Empty Folder Icon */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Folder Back */}
          <path
            d="M60 70 h30 l10 10 h40 v60 h-80 z"
            fill="currentColor"
            className="text-gray-300 dark:text-gray-700"
          />
          {/* Folder Front */}
          <path
            d="M60 75 h35 l10 10 h35 v55 h-80 z"
            fill="currentColor"
            className="text-gray-400 dark:text-gray-600"
          />
          {/* Folder Tab */}
          <path
            d="M60 75 h25 l5 -10 h-25 z"
            fill="currentColor"
            className="text-gray-500 dark:text-gray-500"
          />
        </motion.g>

        {/* Floating Documents */}
        <motion.g
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <rect
            x="70"
            y="95"
            width="25"
            height="30"
            rx="2"
            fill="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          <line x1="75" y1="100" x2="90" y2="100" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
          <line x1="75" y1="105" x2="90" y2="105" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
          <line x1="75" y1="110" x2="85" y2="110" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
        </motion.g>

        <motion.g
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        >
          <rect
            x="105"
            y="90"
            width="25"
            height="30"
            rx="2"
            fill="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          <line x1="110" y1="95" x2="125" y2="95" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
          <line x1="110" y1="100" x2="125" y2="100" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
          <line x1="110" y1="105" x2="120" y2="105" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
        </motion.g>

        {/* Question Mark */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <circle
            cx="155"
            cy="65"
            r="12"
            fill="currentColor"
            className="text-primary-200 dark:text-primary-900"
          />
          <text
            x="155"
            y="72"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="currentColor"
            className="text-primary-600 dark:text-primary-400"
          >
            ?
          </text>
        </motion.g>
      </motion.svg>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-center"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {message}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default NoDataIllustration;
