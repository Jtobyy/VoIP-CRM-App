import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../styles/global';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';

const AddUserSuccessModal = ({
  visible,
  inviteMethod,  // 'sms' | 'whatsapp'
  // phone,
  message,
  // onSendSMS,
  // onSendWhatsApp,
  onCopy,
  onAddAnother,
  onCancel,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>

          <TouchableOpacity style={styles.closeIcon} onPress={onCancel}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <FontAwesome6 name="check" iconStyle='solid' size={32} color="#22C55E" />
          </View>

          <Text style={styles.successText}>Invitation created</Text>
          <Text style={styles.subText}>
            Share the invite using the options below.
          </Text>

          {/* Your green primary button reused */}
          <TouchableOpacity style={styles.addButton} onPress={onAddAnother}>
            <Text style={styles.addButtonText}>Add another user</Text>
          </TouchableOpacity>

          {/* New secondary action
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={inviteMethod === 'sms' ? onSendSMS : onSendWhatsApp}
          >
            <Text style={styles.secondaryButtonText}>
              {inviteMethod === 'sms' ? `Send SMS to ${phone}` : `Send WhatsApp Message to ${phone}`}
            </Text>
          </TouchableOpacity> */}

          {/* New ghost action */}
          <TouchableOpacity style={styles.ghostButton} onPress={onCopy}>
            <Text style={styles.ghostButtonText}>Copy message</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


export default AddUserSuccessModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  closeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  iconCircle: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 18,
    marginBottom: 18,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  addButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  messagePreview: {
  width: '100%',
  backgroundColor: '#F6F6F6',
  borderRadius: 12,
  padding: 12,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#EEE',
},
messagePreviewText: {
  fontSize: 13,
  color: '#333',
},

secondaryButton: {
  backgroundColor: '#E7F7E1',        // matches your active invite state
  paddingVertical: 14,
  paddingHorizontal: 30,
  borderRadius: 12,
  marginBottom: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.primary,
},
secondaryButtonText: {
  color: colors.primary,
  fontWeight: '600',
  fontSize: 16,
},

ghostButton: {
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 12,
  marginBottom: 8,
  alignItems: 'center',
},
ghostButtonText: {
  color: '#333',
  fontSize: 15,
  fontWeight: '500',
},
});
