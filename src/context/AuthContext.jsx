/**
 * Authentication context provider for managing user authentication state
 * @module AuthContext
 */

import { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const AuthContext = createContext(null);

/**
 * Authentication provider component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifies the authentication token with the server
   * @param {string} token - JWT token to verify
   */
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid or expired
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs in a user with username and password
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @throws {Error} If login fails
   */
  const login = async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  /**
   * Logs out the current user
   */
  const logout = async () => {
    const token = localStorage.getItem('authToken');

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        // Ignore logout errors
      }
    }

    localStorage.removeItem('authToken');
    setUser(null);
  };

  /**
   * Gets authorization header for API requests
   * @returns {Object} Headers object with Authorization if token exists
   */
  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    getAuthHeader,
    isAdmin: user?.isAdmin || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
