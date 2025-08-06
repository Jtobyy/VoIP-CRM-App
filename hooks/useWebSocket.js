import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { company } = useAuth();
  const wsRef = useRef(null);
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!company?.id) return;

    const wsUrl = `wss://ws-staging.nativetalkcrm.com/ws/chat/?uuid=${company.id}&type=company`;

    const connect = () => {
      if (wsRef.current) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          listenersRef.current.forEach((cb) => cb(data));
        } catch (e) {
          console.error('Invalid WS data', e);
        }
      };

      ws.onclose = () => {
        console.log('🔄 Reconnecting WebSocket...');
        wsRef.current = null;
        setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.error('❌ WebSocket error:', e.message);
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
    };
  }, [company]);

  const addMessageListener = (callback) => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter((cb) => cb !== callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ addMessageListener }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
