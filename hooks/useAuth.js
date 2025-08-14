// hooks/useAuth.js or AuthContext.js
import React, { useState, useEffect, useContext, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSnackbar } from './useSnackbar';
import axios from 'axios';
import {formatPhoneNumber} from '../utils/phone'

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedCompany = await AsyncStorage.getItem('company');

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);

          if (parsedUser?.access) {
            fetchCompanyDetails(parsedUser.access);
          }
        }

        if (storedCompany) {
          setCompany(JSON.parse(storedCompany));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const fetchCompanyDetails = async (accessToken) => {
    try {
      const res = await axios.get(`https://staging.core.nativetalkcrm.com/api/companies/details/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Domain': 'tech4mation',
        },
      });
  
      if (res.data?.company) {
        setCompany(res.data.company);
        await AsyncStorage.setItem('company', JSON.stringify(res.data.company));
      }
    } catch (err) {
      console.error('Company details fetch failed:', err);
    }
  };  

  const login = async (username, password) => {
    try {
      const formattedPhone = formatPhoneNumber(username);
      console.log('username ', formattedPhone)
      console.log('password ', password)

      const res = await axios.post('https://staging.core.nativetalkcrm.com/api/auth/mobile/signin/', {
        phone_number: formattedPhone,
        password,
      },{
           headers: {
            'User-Domain': '+2349167523634',
             'Content-Type': 'application/json'
         }
      });

      console.log('res is ', res)
      const userData = res.data;
      setUser(userData);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      if (userData?.access) {
        fetchCompanyDetails(userData.access);
      }

      showSnackbar('Login successful!', 'success');
      return true;
    } catch (err) {
     console.log('response:', err?.response?.status, err?.response?.data);
     showSnackbar(err?.response?.data?.detail || 'Login failed', 'error');
     return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    await AsyncStorage.clear();
    showSnackbar('Logged out', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, company, isAuthenticated, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
