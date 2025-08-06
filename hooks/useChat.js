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

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/communication/history/?lead_id=${leadId}`);
      setMessages(res.data.results);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, [leadId]);

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
    loadMessages();
  }, [loadMessages]);


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
    setPickedFile
  };
};

export default useChat;
