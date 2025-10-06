import { useState } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import { useSnackbar } from './useSnackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isRefreshing = false;
let failedQueue = [];
let isBlockedForRequests = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const cancelTokens = [];
  const { logout } = useAuth();
  const { showSnackbar } = useSnackbar();

  const cancelAllRequests = () => {
    cancelTokens.forEach(source => source.cancel("Request cancelled due to logout or navigation"));
    cancelTokens.length = 0;
  };

  const axiosInstance = axios.create({
    baseURL: 'https://staging.core.nativetalkcrm.com/api',
     headers: { 'User-Domain': 'tech4mation' },
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      const source = axios.CancelToken.source();
      config.cancelToken = source.token;
      cancelTokens.push(source);

      const showLoader = config.showLoader !== false;

      if (isBlockedForRequests && !config.url.includes('/auth')) {
        console.warn(`🚫 Request blocked during token refresh: ${config.url}`);
        source.cancel("Request blocked during token refresh.");
        return Promise.reject(new axios.Cancel("Request blocked during token refresh."));
      }

      if (showLoader) setLoading(true);

      try {
        const userString = await AsyncStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;

        if (user?.access) {
          config.headers['Authorization'] = `Bearer ${user.access}`;
        }
      } catch (err) {
        console.warn("Error loading user from AsyncStorage", err);
      }

      return config;
    },
    (error) => {
      setLoading(false);
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      if (response.config.showLoader !== false) setLoading(false);
      return response;
    },
    async (error) => {
      setLoading(false);

      const originalRequest = error.config;

      if (axios.isCancel(error) || error.name === 'CanceledError') {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        console.warn('⚠️ 401 detected, handling token refresh...');

        cancelAllRequests();
        isBlockedForRequests = true;

        const userString = await AsyncStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;

        if (!user?.refresh) {
          await AsyncStorage.clear();
          logout();
          showSnackbar('Session expired. Please log in again.', 'error');
          isBlockedForRequests = false;
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await axios.post(
            `${process.env.EXPO_PUBLIC_API_URL}/auth/token/refresh/`,
            { refresh: user.refresh }
          );

          const updatedUser = { ...user, access: data.access, refresh: data.refresh };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          processQueue(null, data.access);

          originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          cancelAllRequests();
          showSnackbar('Session expired. Please log in again.', 'error');
          logout();
          return;
        } finally {
          isRefreshing = false;
          isBlockedForRequests = false;
        }
      }

      // Generic error handling
      console.log('error is ', error)
      const errorMsg = error.response?.data?.detail || 'Something went wrong.';
      showSnackbar(errorMsg, 'error');
      return Promise.reject(error);
    }
  );

  return { api:axiosInstance, loading, cancelAllRequests };
};
