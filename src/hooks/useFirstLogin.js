import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to detect if this is the user's first login
 * Returns true only once per user
 */
const useFirstLogin = () => {
  const { user } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    if (user) {
      const hasLoggedInBefore = localStorage.getItem(`user_${user.id || user._id}_has_logged_in`);
      
      if (!hasLoggedInBefore) {
        setIsFirstLogin(true);
        // Mark that user has logged in
        localStorage.setItem(`user_${user.id || user._id}_has_logged_in`, 'true');
      } else {
        setIsFirstLogin(false);
      }
    }
  }, [user]);

  return isFirstLogin;
};

export default useFirstLogin;
