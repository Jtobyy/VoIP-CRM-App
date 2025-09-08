import React,{useState,useEffect} from 'react';
import {
   Modal,
   View,
   Text,
   TouchableOpacity,
   ActivityIndicator,
   Image,
   StyleSheet
} from 'react-native'
import { useLoading } from '../../../hooks/useLoading';
import Clipboard from '@react-native-clipboard/clipboard';

const ConnectWhatsAppModal = ({ visible, onClose, channel, api, handleApiError }) => {
  const [freshChannel, setFreshChannel] = useState(channel);
  const {loading, setLoading} = useLoading();

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/channels/all/');
        const found = data?.channels?.find(c => c.name === 'WhatsApp');
        setFreshChannel(found || channel);
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, channel]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>WhatsApp Channel</Text>

          <View style={[styles.modalBody, { alignItems: 'center' }]}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <>
                {!!freshChannel?.image && (
                  <Image source={{ uri: freshChannel.image }} style={{ width: 64, height: 64, marginBottom: 12 }} />
                )}
                <Text style={{ fontSize: 18, fontWeight: '600' }}>WhatsApp</Text>
                <Text style={{ textAlign: 'center', marginTop: 8 }}>
                  {freshChannel?.connected
                    ? 'Your WhatsApp is Connected'
                    : 'Your request has been received!\nWe’ll review it and get back to you on WhatsApp.'}
                </Text>
              </>
            )}
          </View>

          <View style={styles.modalFooterRow}>
            <TouchableOpacity onPress={onClose} style={[styles.btnPrimary, { flex: 1 }]}>
              <Text style={styles.btnPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConnectWhatsAppModal

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