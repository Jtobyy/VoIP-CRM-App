import {
   Modal,
   View,
   Text,
   TouchableOpacity,
   StyleSheet
} from 'react-native'

const ComingSoonModal = ({ visible, title, message, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={[styles.modalBody, { textAlign: 'center' }]}>{message}</Text>
          <View style={styles.modalFooterRow}>
            <TouchableOpacity onPress={onClose} style={[styles.btnSecondary, { flex: 1 }]}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ComingSoonModal

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