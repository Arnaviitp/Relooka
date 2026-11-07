import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeCapability, setActiveCapability] = useState('renter');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (api.accessToken) {
        try {
          const res = await api.get('/users/me');
          if (res.success && res.data) {
            setUser(res.data);
            const caps = res.data.capabilities || ['renter'];
            const savedCap = localStorage.getItem('lw_active_cap');
            if (savedCap && caps.includes(savedCap)) {
              setActiveCapability(savedCap);
            } else {
              setActiveCapability(caps[0] || 'renter');
            }
          }
        } catch (_) {
          api.clearTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (emailOrPhone, password) => {
    const res = await api.post('/auth/login', { emailOrPhone, password });
    if (res.success && res.data) {
      api.setTokens(res.data.tokens);
      setUser(res.data.user);
      const caps = res.data.user.capabilities || ['renter'];
      setActiveCapability(caps[0] || 'renter');
      localStorage.setItem('lw_active_cap', caps[0] || 'renter');
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const signup = async (formData) => {
    const res = await api.post('/auth/signup', formData);
    if (res.success && res.data) {
      api.setTokens(res.data.tokens);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Signup failed');
  };

  const verifyEmailOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-email-otp', { email, otp });
    if (res.success) {
      setUser(prev => prev ? { ...prev, emailVerified: true } : prev);
      return res.data;
    }
    throw new Error(res.message || 'Email OTP verification failed');
  };

  const verifyPhoneOtp = async (phone, otp) => {
    const res = await api.post('/auth/verify-phone-otp', { phone, otp });
    if (res.success) {
      setUser(prev => prev ? { ...prev, phoneVerified: true } : prev);
      return res.data;
    }
    throw new Error(res.message || 'Phone OTP verification failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (_) {}
    api.clearTokens();
    setUser(null);
    localStorage.removeItem('lw_active_cap');
  };

  const switchActiveCapability = (cap) => {
    if (user?.capabilities?.includes(cap)) {
      setActiveCapability(cap);
      localStorage.setItem('lw_active_cap', cap);
    }
  };

  const toggleCapability = async (newCapabilities) => {
    const res = await api.put('/users/me/capabilities', { capabilities: newCapabilities });
    if (res.success) {
      setUser(prev => ({ ...prev, capabilities: res.data.capabilities }));
      if (!res.data.capabilities.includes(activeCapability)) {
        setActiveCapability(res.data.capabilities[0]);
      }
      return res.data;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeCapability,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        verifyEmailOtp,
        verifyPhoneOtp,
        logout,
        switchActiveCapability,
        toggleCapability,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

