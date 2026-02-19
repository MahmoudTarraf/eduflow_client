import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
  showCelebration: false,
  weakPassword: false
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        weakPassword: !!action.payload.weakPassword
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
        weakPassword: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        weakPassword: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'SHOW_CELEBRATION':
      return {
        ...state,
        showCelebration: true
      };
    case 'HIDE_CELEBRATION':
      return {
        ...state,
        showCelebration: false
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user (on start and when token changes)
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await axios.get('/api/auth/me');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token: state.token,
              weakPassword: state.weakPassword
            }
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    loadUser();
  }, [state.token]);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await axios.post('/api/auth/login', { email, password }, { withCredentials: true });
      if (response.data && response.data.requires2FA) {
        // Store short-lived 2FA session and email for the next step
        if (response.data.twoFactorSession) {
          sessionStorage.setItem('twoFactorSession', response.data.twoFactorSession);
        }
        sessionStorage.setItem('twoFactorEmail', email);
        dispatch({ type: 'AUTH_FAILURE', payload: null });
        return { success: true, requires2FA: true };
      }
      const { token, user, weakPassword } = response.data;
      
      // Check if user is banned - prevent login
      if (user.status === 'banned') {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Your account has been banned. Please contact support for assistance.' });
        toast.error('Your account has been banned. Please contact support for assistance.');
        return { success: false, error: 'Account banned' };
      }
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token, weakPassword }
      });
      
      // Show welcome toast animation (every login)
      console.log('🎉 LOGIN: Showing welcome toast for user', user.name);
      
      // Show welcome toast with i18n support
      setTimeout(() => {
        let isArabic = false;
        try {
          const { i18n } = require('react-i18next');
          isArabic = i18n && i18n.language === 'ar';
        } catch (error) {
          console.warn('i18n not available:', error);
          isArabic = false;
        }
        const welcomeMessage = isArabic 
          ? `مرحباً بعودتك، ${user.name}! لنبدأ التعلم! 🎓`
          : `Welcome back, ${user.name}! Let's continue learning! 🎓`;
          
        window.dispatchEvent(new CustomEvent('show-welcome-toast', {
          detail: { message: welcomeMessage }
        }));
      }, 1000); // Small delay to let page load
      
      // For students: check if streak animation should be shown (only on streak updates)
      if (user && user.role === 'student') {
        // Prevent duplicate streak calls using TWO levels of protection
        const streakKey = `streak_in_progress_${user.email}`;
        const streakCompletedKey = `streak_completed_${user.email}_${Date.now().toString().substring(0, 10)}`; // 10-second precision
        
        console.log('🔥 LOGIN: Checking streak processing for', user.name, {
          streakKey,
          streakCompletedKey,
          alreadyProcessing: !!sessionStorage.getItem(streakKey),
          alreadyCompleted: !!sessionStorage.getItem(streakCompletedKey)
        });
        
        // Check if already processing OR already completed
        if (sessionStorage.getItem(streakKey) || sessionStorage.getItem(streakCompletedKey)) {
          console.log('🚫 LOGIN: Already processing or completed streak for this session');
          return { success: true }; // Already processing or completed streak
        }
        
        console.log('✅ LOGIN: Starting streak processing for', user.name);
        sessionStorage.setItem(streakKey, 'true');
        sessionStorage.setItem(streakCompletedKey, 'true');
        
        setTimeout(async () => {
          try {
            console.log('🔥 LOGIN: Starting streak API call after welcome delay...');
            const res = await axios.post('/api/gamification/update-streak');
            const data = res?.data;
            console.log('🔥 LOGIN: Streak API response:', data);
            
            // Only show streak animation if streak has increased (not every login)
            if (data && data.streakDays !== undefined) {
              console.log('🔥 LOGIN: Received streak data from server', data);
              
              // Check if streak has increased since last shown
              const currentStreak = data.streakDays;
              const lastShownStreak = data.lastShownStreak || 0;

              try {
                window.dispatchEvent(new CustomEvent('streak-updated', { detail: { streakDays: currentStreak } }));
              } catch (e) {}
              
              console.log('🔥 LOGIN: Streak comparison', {
                currentStreak,
                lastShownStreak,
                shouldShowAnimation: currentStreak > lastShownStreak
              });
              
              // Only show animation if streak increased
              if (currentStreak > lastShownStreak) {
                console.log('🔥 LOGIN: Streak increased! Showing toast animation');
                
                // Create streak message (short & motivational) with i18n support
                let isArabic = false;
                try {
                  const { i18n } = require('react-i18next');
                  isArabic = i18n && i18n.language === 'ar';
                } catch (error) {
                  console.warn('i18n not available:', error);
                  isArabic = false;
                }
                
                const streakMessage = currentStreak === 1
                  ? isArabic ? "🔥 سلسلة يوم واحد! بداية رائعة!" : "🔥 1-day streak! Great start!"
                  : currentStreak >= 30
                  ? isArabic ? `🏆 سلسلة ${currentStreak} يوم! أسطوري!` : `🏆 ${currentStreak}-day streak! Legendary!`
                  : currentStreak >= 14
                  ? isArabic ? `⭐ سلسلة ${currentStreak} يوم! مذهل!` : `⭐ ${currentStreak}-day streak! Amazing!`
                  : currentStreak >= 7
                  ? isArabic ? `💪 سلسلة ${currentStreak} يوم! أنت مُلتهب!` : `💪 ${currentStreak}-day streak! On fire!`
                  : currentStreak >= 3
                  ? isArabic ? `🚀 سلسلة ${currentStreak} يوم! واصل المسير!` : `🚀 ${currentStreak}-day streak! Keep going!`
                  : isArabic ? `🔥 سلسلة ${currentStreak} يوم! واصل المسير!` : `🔥 ${currentStreak}-day streak! Keep going!`;
                
                // Show streak toast (only once with proper deduplication)
                const toastKey = `streak_toast_shown_${currentStreak}_${Date.now().toString().substring(0, 10)}`;
                if (!sessionStorage.getItem(toastKey)) {
                  sessionStorage.setItem(toastKey, 'true');
                  
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('show-streak-toast', {
                      detail: { 
                        streakDays: currentStreak,
                        streakMessage,
                        isStreakUpdate: true
                      }
                    }));
                  }, 1500); // Show after welcome toast
                  
                  // Clear the toast key after 10 seconds
                  setTimeout(() => {
                    sessionStorage.removeItem(toastKey);
                  }, 10000);
                }
                
                // Update lastShownStreak on server
                try {
                  await axios.post('/api/gamification/update-last-shown-streak', {
                    lastShownStreak: currentStreak
                  });
                  console.log('🔥 LOGIN: Updated lastShownStreak to', currentStreak);
                } catch (error) {
                  console.error('Failed to update lastShownStreak:', error);
                }
              } else {
                console.log('🔥 LOGIN: Streak unchanged, no toast needed');
              }
            } else {
              console.log('🚫 LOGIN: No streak data received from server');
            }
          } catch (error) {
            console.log('Streak update failed:', error);
          } finally {
            // Clear the in-progress flag after a short delay
            setTimeout(() => {
              sessionStorage.removeItem(streakKey);
              console.log('🔥 LOGIN: Cleared in-progress flag', streakKey);
            }, 5000);
            
            // Clear the completed flag after a longer delay (to allow for next login)
            setTimeout(() => {
              sessionStorage.removeItem(streakCompletedKey);
              console.log('🔥 LOGIN: Cleared completed flag', streakCompletedKey);
            }, 60000); // 60 seconds
          }
        }, 3000); // Reduced delay to 3 seconds
      }

      // Delay login success message to avoid overlap with animations
      setTimeout(() => {
        toast.success('Login successful!');
      }, 6000); // After welcome (3s) + streak (4s) animations complete
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete('/api/users/account');
      toast.success('Account deleted successfully');
      logout();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await axios.post('/api/auth/register', userData);
      // Backend now returns a message only; no token or user
      // Save email locally for resend verification convenience
      if (userData?.email) {
        localStorage.setItem('pendingEmail', userData.email);
      }
      dispatch({ type: 'AUTH_FAILURE', payload: null });
      toast.success(response.data?.message || 'Verification email sent. Please verify your email.');
      return { success: true };
    } catch (error) {
      const api = error?.response?.data || {};
      const validationErrors = Array.isArray(api.errors) ? api.errors : [];
      const messages = [...new Set(validationErrors.map(e => e?.msg || e?.message).filter(Boolean))];
      const message = messages.length
        ? messages.join(' • ')
        : (api.message || 'Registration failed');
      const shouldVerify = !!api.shouldVerify;
      dispatch({ type: 'AUTH_FAILURE', payload: message });

      // Persist email for easier resend verification when backend explicitly indicates pending verification
      if (shouldVerify && userData?.email) {
        localStorage.setItem('pendingEmail', userData.email);
      }

      toast.error(message);
      return { success: false, error: message, shouldVerify };
    }
  };

  const resendVerification = async (email) => {
    try {
      const payload = { email };
      await axios.post('/api/auth/resend-verification', payload);
      toast.success('Verification email sent');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('twofa_warning_dismissed');
      }
    } catch (e) {}
    dispatch({ type: 'LOGOUT' });
    
    // Clear axios auth header immediately
    try { delete axios.defaults.headers.common['Authorization']; } catch (_) {}
    try { toast.success('Logged out successfully'); } catch (_) {}
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('[AuthContext] Sending profile update:', profileData);
      const response = await axios.put('/api/auth/profile', profileData);
      console.log('[AuthContext] Received response:', response.data);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Profile update error:', error.response?.data || error);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      await axios.put('/api/auth/password', passwordData);
      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const hideCelebration = () => {
    dispatch({ type: 'HIDE_CELEBRATION' });
  };

  const submitTwoFactor = async ({ code, rememberDevice, deviceName }) => {
    try {
      const twoFactorSession = sessionStorage.getItem('twoFactorSession');
      const email = sessionStorage.getItem('twoFactorEmail');
      const payload = { code, rememberDevice, deviceName, twoFactorSession, email };
      const response = await axios.post('/api/auth/login-2fa', payload, { withCredentials: true });
      const { token, user, weakPassword } = response.data;
      if (!token || !user) {
        throw new Error('Invalid server response');
      }
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token, weakPassword } });
      sessionStorage.removeItem('twoFactorSession');
      sessionStorage.removeItem('twoFactorEmail');
      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '2FA verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshUser = async () => {
    try {
      if (!state.token) return { success: false };
      const response = await axios.get('/api/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.data.user, token: state.token } });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    weakPassword: state.weakPassword,
    showCelebration: state.showCelebration,
    login,
    submitTwoFactor,
    register,
    logout,
    updateProfile,
    updatePassword,
    deleteAccount,
    resendVerification,
    hideCelebration,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
