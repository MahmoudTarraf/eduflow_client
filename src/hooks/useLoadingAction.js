import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook for handling async actions with loading state and error handling
 * @param {Function} action - The async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} - { execute, loading, error }
 */
const useLoadingAction = (action, options = {}) => {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'Action failed',
    showSuccessToast = true,
    showErrorToast = true
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await action(...args);
      
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return { success: true, data: result };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || errorMessage;
      setError(errorMsg);
      
      if (showErrorToast) {
        toast.error(errorMsg);
      }
      
      if (onError) {
        onError(err);
      }
      
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [action, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast]);

  return { execute, loading, error };
};

export default useLoadingAction;
