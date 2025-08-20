// hooks/useAuth.js or AuthContext.js
import React, { useState, useEffect, useContext, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSnackbar } from './useSnackbar';
import axios from 'axios';
import {formatPhoneNumber} from '../utils/phone'
import {getFcmTokenForLogin} from '../firebase/getTokenforLogin'

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

  const fetchInvitePermission = async (userId, accessToken) => {
  try {
    const res = await axios.get(
      `https://staging.core.nativetalkcrm.com/api/users/check-permission/${userId}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Domain': 'tech4mation', // keep whatever you already send
        },
      }
    );
    return !!res?.data?.has_permission;
  } catch (err) {
    console.error('Permission check failed:', err?.response?.status, err?.response?.data);
    return false; // safe default
  }
};


  const login = async (username, password, navigation) => {
    try {
      const formattedPhone = formatPhoneNumber(username);
      const { token: fcmToken, platform } = await getFcmTokenForLogin({ timeoutMs: 1500 });
      console.log('username ', formattedPhone)
      console.log('password ', password)
      console.log('fcm token ', fcmToken)

      const res = await axios.post('https://staging.core.nativetalkcrm.com/api/auth/mobile/signin/', {
        phone_number: formattedPhone,
        password,
        fcm_token: fcmToken,
      },{
           headers: {
            'User-Domain': '+2349167523634',
             'Content-Type': 'application/json'
         }
      });

       const data = res.data;
       console.log('Login response:')
    
    // === Case A: user is not yet verified ===
    if (data?.verified === false && !data?.access) {
      showSnackbar(data?.message || 'OTP sent to your phone number.', 'info');

      // IMPORTANT: do not set auth state yet
      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        password,         
        companyName: '',
        flowType: 'login', // new flow
      });

      return { needsVerification: true };
    }

    // === Case B: verified and tokens present ===
    if (data?.access) {
      const invitePerm = await fetchInvitePermission(data.user_id, data.access);
      const userPayload = {
       ...data,
           permissions: {
             inviteUsers: invitePerm,
          },
     };
      setUser(userPayload);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(userPayload));
      fetchCompanyDetails(data.access);
      showSnackbar('Login successful!', 'success');
      return { success: true };
    }

    // Unexpected response shape
    showSnackbar(data?.message || 'Unexpected login response', 'error');
    return { success: false };
  } catch (err) {
    console.error('Login error:',err)
    console.log('response:', err?.response?.status, err?.response?.data);
    showSnackbar(err?.response?.data?.detail || 'Login failed', 'error');
    return { success: false, error: err };
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
    <AuthContext.Provider value={{ user, company, isAuthenticated, loading, login, logout, setUser,  canInviteUsers: !!user?.permissions?.inviteUsers, }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
