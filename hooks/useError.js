import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './useAuth';
import { useSnackbar } from './useSnackbar';


const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();
  const { logout } = useAuth();

  const handleApiError = (error) => {
    console.error('API Error:', error);

    const errorData = error?.response?.data?.error;

    // Case 1: Field-level errors (e.g. { email: ["invalid"], password: ["too short"] })
    if (errorData && typeof errorData === 'object') {
      for (let field in errorData) {
        if (errorData.hasOwnProperty(field)) {
          const fieldErrors = errorData[field];
          fieldErrors.forEach((msg) => {
            showSnackbar(`${field} ${msg}`, 'error');
          });
        }
      }
      return;
    }

    // Case 2: General error messages
    const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'An error occurred';
    showSnackbar(errorMessage, 'error');
    setError(errorMessage);

    // logout on 401
    if (error?.response?.status === 401) {
      logout();
    }
  };

  return (
    <ErrorContext.Provider value={{ error, setError, handleApiError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);
