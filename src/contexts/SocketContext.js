import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket connection
    const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL;
    const trimmedSocketUrl = rawSocketUrl ? String(rawSocketUrl).trim().replace(/\/+$/, '') : '';
    const normalizedSocketUrl = trimmedSocketUrl.endsWith('/api') ? trimmedSocketUrl.slice(0, -4) : trimmedSocketUrl;
    const socketUrl = normalizedSocketUrl || 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Message events
    newSocket.on('receive_message', (message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => [...prev, message]);
      
      // Add notification
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'message',
        message: `New message from ${message.sender?.name}`,
        data: message,
        timestamp: new Date()
      }]);
    });

    newSocket.on('message_sent', (data) => {
      console.log('✅ Message sent successfully:', data);
    });

    newSocket.on('message_error', (error) => {
      console.error('❌ Message error:', error);
    });

    // Typing indicators
    newSocket.on('user_typing', (data) => {
      console.log('User typing:', data.userId);
    });

    newSocket.on('user_stop_typing', (data) => {
      console.log('User stopped typing:', data.userId);
    });

    // Payment notifications
    newSocket.on('payment_verified', (data) => {
      console.log('💰 Payment verified:', data);
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'payment',
        message: 'Your payment has been verified!',
        data,
        timestamp: new Date()
      }]);
    });

    // Certificate notifications
    newSocket.on('certificate_issued', (data) => {
      console.log('🎓 Certificate issued:', data);
      setNotifications((prev) => [...prev, {
        id: Date.now(),
        type: 'certificate',
        message: 'Your certificate is ready!',
        data,
        timestamp: new Date()
      }]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Helper functions
  const sendMessage = useCallback((data) => {
    if (socket && connected) {
      socket.emit('send_message', data);
    } else {
      console.error('Socket not connected');
    }
  }, [socket, connected]);

  const joinGroup = useCallback((groupId) => {
    if (socket && connected) {
      socket.emit('join_group', groupId);
    }
  }, [socket, connected]);

  const leaveGroup = useCallback((groupId) => {
    if (socket && connected) {
      socket.emit('leave_group', groupId);
    }
  }, [socket, connected]);

  const sendTyping = useCallback((data) => {
    if (socket && connected) {
      socket.emit('typing', data);
    }
  }, [socket, connected]);

  const sendStopTyping = useCallback((data) => {
    if (socket && connected) {
      socket.emit('stop_typing', data);
    }
  }, [socket, connected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    socket,
    connected,
    messages,
    notifications,
    sendMessage,
    joinGroup,
    leaveGroup,
    sendTyping,
    sendStopTyping,
    clearNotifications,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
