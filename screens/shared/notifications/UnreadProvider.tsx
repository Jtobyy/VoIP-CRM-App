import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUnreadCount, setUnreadCount } from './unread';

type Ctx = {
  unreadCount: number;
  setUnreadCountState: (n: number) => void;
  refreshUnread: () => Promise<void>;
};

const UnreadCtx = createContext<Ctx>({
  unreadCount: 0,
  setUnreadCountState: () => {},
  refreshUnread: async () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCountState] = useState(0);

  const refreshUnread = useCallback(async () => {
    const n = await getUnreadCount();
    setUnreadCountState(n);
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // keep storage in sync if someone sets state directly
  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount]);

  return (
    <UnreadCtx.Provider value={{ unreadCount, setUnreadCountState, refreshUnread }}>
      {children}
    </UnreadCtx.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadCtx);
}
