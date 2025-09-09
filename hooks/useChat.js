// hooks/useChat.js

import { useEffect, useState, useCallback } from 'react';
import { useApi } from './useApi';
import { pick, types } from '@react-native-documents/picker'
import { useWebSocket } from '../hooks/useWebSocket'

const useChat = (leadId) => {
  const { api } = useApi();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pickedFile, setPickedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addMessageListener } = useWebSocket();

  // NEW: pagination state
  const [nextUrl, setNextUrl] = useState(null);     // URL to fetch older messages
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

    // Helper to merge older pages at the TAIL (because list is inverted)
  const mergeOlder = useCallback((older = []) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const deduped = older.filter((m) => !seen.has(m.id));
      return [...prev, ...deduped];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!leadId) return;
    try {
      setLoading(true)
      const res = await api.get(`/communication/history/?lead_id=${leadId}`);
      const data = res?.data || {};
      setMessages(data.results || []);
      setNextUrl(data.next || null);
      setHasMore(Boolean(data.next));
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  
  // NEW: load older (next page) when user reaches top
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextUrl || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await api.get(nextUrl);
      const data = res?.data || {};
      mergeOlder(data.results || []);
      setNextUrl(data.next || null);
      setHasMore(Boolean(data.next));
    } catch (err) {
      console.error('Failed to load older messages', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextUrl, loadingMore, mergeOlder]);

  // Reset state whenever thread changes
  useEffect(() => {
    setMessages([]);
    setNextUrl(null);
    setHasMore(true);
    loadMessages();
  }, [leadId, loadMessages]);

  const sendMessage = async () => {
    if (!text && !pickedFile) return;

    const formData = new FormData();
    formData.append('lead_id', leadId);
    formData.append('content_type', pickedFile ? 'document' : 'text');
    formData.append('content', text || '');

    if (pickedFile) {
      formData.append('document', {
        uri: pickedFile?.uri,
        name: pickedFile?.name,
        type: pickedFile?.type,
      });
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const optimisticMsg = {
      id: tempId,
      content: text,
      content_type: pickedFile ? 'document' : 'text',
      created_at: new Date().toISOString(),
      company_is_sender: true,
      status: 'sending', // optional
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      setLoading(true);
      const res = await api.post('/communication/send-to-lead/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    
      // Replace optimistic message with real one
      // console.log('response is ', res)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...res.data.data, company_is_sender: true } : msg
        )
      );      
      setText('');
      setPickedFile(null);
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await pick({ type: [types.allFiles] });
      setPickedFile({
        uri: result[0].uri,
        name: result[0].name,
        type: result[0].type,
      });
      // console.log('picked file is ', result[0])
    } catch (err) {
      console.error('File pick error', err);
    }
  };

useEffect(() => {
  const unsubscribe = addMessageListener((data) => {
    if (data?.type === 'message' && data.message) {
      const message = data.message;
      if (
        message.lead_sender === leadId ||
        message.lead_receiver === leadId
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;

          const tempMatchIndex = prev.findIndex((msg) =>
            typeof msg.id === 'string' &&
            msg.id.startsWith('temp-') &&
            msg.content === message.content
          );

          const updated = [...prev];
          if (tempMatchIndex !== -1) {
            updated[tempMatchIndex] = message;
            return updated;
          }

          return [message, ...prev];
        });
      }
    }
  });

  return unsubscribe;
}, [leadId, addMessageListener]);


  return {
    messages,
    text,
    setText,
    pickedFile,
    pickFile,
    sendMessage,
    refresh: loadMessages,
    loading,
    loadingMore,  
    loadMore, 
    setPickedFile
  };
};

export default useChat;
