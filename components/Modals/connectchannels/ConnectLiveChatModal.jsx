import React,{useState,useEffect} from 'react';
import {
   Modal,
   View,
   Text,
   TouchableOpacity,
   ActivityIndicator,
   Image,
   Alert,
   StyleSheet
} from 'react-native'
import { useLoading } from '../../../hooks/useLoading';
import Clipboard from '@react-native-clipboard/clipboard';

const ConnectLiveChatModal = ({ visible, onClose, api, handleApiError }) => {
  const [script, setScript] = useState('');
  const {loading, setLoading} = useLoading();

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.post('/channels/generate-livechat-script/', {});
        const urlOrScript = res?.data?.script_url || '';
        setScript(urlOrScript);
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  const copyScript = () => {
    Clipboard.setString(script);
    Alert.alert('Copied', 'Script copied!');
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Nativetalk Chat</Text>

          <View style={styles.modalBody}>
            <Text>Please copy the script to embed in your website:</Text>
            {loading ? (
              <ActivityIndicator style={{ marginTop: 8 }} />
            ) : (
              <Text selectable style={styles.codeBox}>{script || 'Script not found.'}</Text>
            )}
          </View>

          <View style={styles.modalFooterRow}>
            <TouchableOpacity onPress={onClose} style={styles.btnSecondary}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={copyScript} style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>Copy Script</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConnectLiveChatModal

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  modalBody: { marginTop: 8 },
  codeBox: { marginTop: 8, padding: 10, borderWidth: 1, borderColor: '#DFE1E6', borderRadius: 10, fontFamily: 'monospace' },
  instructions: { color: '#374151' },
  modalFooterRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnSecondary: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#808897' },
  btnPrimary: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#3EBF0F' },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
});