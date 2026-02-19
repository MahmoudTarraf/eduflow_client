import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If instructor route but instructor not approved, redirect to pending page
  if (allowedRoles.includes('instructor') && user.role === 'instructor' && user.instructorStatus !== 'approved') {
    return <Navigate to="/instructor/pending" replace />;
  }

  return children;
};

export default ProtectedRoute;
