import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Smart navigation hook that handles back button behavior intelligently
 * Falls back to role-specific dashboard instead of home when history is shallow
 */
export const useSmartNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  /**
   * Navigate back intelligently
   * - If history exists, go back one step
   * - Otherwise, navigate to role-specific dashboard
   */
  const goBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 2 && document.referrer) {
      navigate(-1);
    } else {
      // Fallback to role-specific dashboard
      if (user?.role === 'instructor') {
        navigate('/instructor');
      } else if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'student') {
        navigate('/student');
      } else {
        navigate('/');
      }
    }
  };

  /**
   * Navigate to a specific route
   */
  const goTo = (path, options = {}) => {
    navigate(path, options);
  };

  /**
   * Get breadcrumb path from current location
   */
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      
      // Create readable label from path
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: index === paths.length - 1
      });
    });

    return breadcrumbs;
  };

  /**
   * Check if we can go back
   */
  const canGoBack = () => {
    return window.history.length > 2 && document.referrer;
  };

  return {
    navigate,
    goBack,
    goTo,
    getBreadcrumbs,
    canGoBack,
    location
  };
};

export default useSmartNavigate;
