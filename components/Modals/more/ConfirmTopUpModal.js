import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../../styles/global';
const ConfirmTopUpModal = ({
  visible,
  amount,
  onCancel,
  onConfirm,
}
) => {
  const formatNaira = (s) => {
  if (!/^\d+$/.test(s)) return '0';
  return parseInt(s, 10).toLocaleString('en-NG');
};
  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* dark overlay */}
      <View style={styles.overlay}>
        {/* white card */}
        <View style={styles.card}>
          {/* close X */}
          <TouchableOpacity style={styles.close} onPress={onCancel} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={styles.closeTxt}>×</Text>
          </TouchableOpacity>

          {/* top icon inside soft green circle */}
          <View style={styles.iconCircle}>
            <Image source={require('../../../assets/infogreen.png')} style={styles.icon} resizeMode="contain" />
          </View>

          {/* title */}
          <Text style={styles.title}>You are purchasing</Text>
          <Text style={styles.amountLine}>NGN {formatNaira(amount)} credit</Text>

          {/* actions row */}
          <View style={styles.row}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmTxt}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    width: '82%', backgroundColor: '#fff', borderRadius: 18, paddingVertical: 26, paddingHorizontal: 22,
    alignItems: 'center',
  },
  close: { position: 'absolute', right: 12, top: 10 },
  closeTxt: { fontSize: 20, fontWeight: 'bold', color: '#000' },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EAF8EA',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  icon: { width: 38, height: 38 },

  title: { fontSize: 16, color: '#222', marginBottom: 6 },
  amountLine: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 18, textAlign: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 18, marginTop: 8,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 8 },
  cancelTxt: { color: '#6B7280', fontSize: 16 },

  confirmBtn: {
    backgroundColor: '#29B110', paddingVertical: 12, paddingHorizontal: 28,
    borderRadius: 12, elevation: 2,
  },
  confirmTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ConfirmTopUpModal