// hooks/useChat.js

import { useEffect, useState, useCallback } from 'react';
import { useApi } from './useApi';
import { pick } from '@react-native-documents/picker'


const useChat = (leadId) => {
  const { api } = useApi();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pickedFile, setPickedFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

    const tempId = `temp-${Date.now()}`;

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
      console.log('response is ', res)
      setMessages((prev) => [
        { ...res.data, company_is_sender: true },
        ...prev.filter((msg) => msg.id !== tempId),
      ]);
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
      const result = await pick({ type: '*/*' });
      if (result.type === 'success') {
        setPickedFile({
          uri: result?.uri,
          name: result?.name,
          type: result?.mimeType || 'application/octet-stream',
        });
      }
    } catch (err) {
      console.error('File pick error', err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    text,
    setText,
    pickedFile,
    pickFile,
    sendMessage,
    refresh: loadMessages,
    loading,
  };
};

export default useChat;
