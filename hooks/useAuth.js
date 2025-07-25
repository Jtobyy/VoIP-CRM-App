import React, { useState } from 'react';

const AuthContext = React.createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modified login function to always return success
  const login = async (username, password) => {
    console.log('Login function called with:', username, password);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('About to set authenticated to true');
      setIsAuthenticated(true);
      console.log('About to return true');
      return true;
    } catch (error) {
      console.error('Error in login function:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};