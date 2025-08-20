import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ImageBackground,
  ScrollView,
  Alert
} from 'react-native';
import { colors } from '../../../styles/global';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AddUserSuccessModal from '../../../components/Modals/more/AddUserSuccessModal';
import {formatPhoneNumber} from '../../../utils/phone'
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import Clipboard from '@react-native-clipboard/clipboard';
import { Share, Linking, Platform } from 'react-native';
// const normalizeForWhatsApp = (phone) => (phone || '').replace(/\D/g, '').replace(/^0+/, '');

// const launchSMS = async (phone, text) => {
//   const number = phone?.trim();
//   const body = encodeURIComponent(text || '');
//   const url = Platform.select({
//     ios: `sms:${number}&body=${body}`,
//     android: `sms:${number}?body=${body}`,
//   });
//   const can = await Linking.canOpenURL(url);
//   if (can) return Linking.openURL(url);
//   return Share.share({ message: text || '' });
// };

// const launchWhatsApp = async (phone, text) => {
//   const waPhone = normalizeForWhatsApp(phone);
//   const msg = encodeURIComponent(text || '');
//   const primary = `whatsapp://send?phone=${waPhone}&text=${msg}`;
//   const fallback = `https://wa.me/${waPhone}?text=${msg}`;
//   if (await Linking.canOpenURL(primary)) return Linking.openURL(primary);
//   if (await Linking.canOpenURL(fallback)) return Linking.openURL(fallback);
//   return Share.share({ message: text || '' });
// };

// const copyToClipboard = (text) => Clipboard.setString(text || '');


const AddUser = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inviteMethod, setInviteMethod] = useState('sms'); // sms or whatsapp
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { handleApiError } = useError();
   const { loading,setLoading } = useLoading();
    const { api } = useApi();
   const phone = formatPhoneNumber(phoneNumber)
   const handleCopyMessage = (text) => {
       Clipboard.setString(text || '');
      Alert.alert('Copied', 'Message copied successfully');
    };

  const [inviteMessage, setInviteMessage] = useState('');
const canSubmit = phoneNumber.trim().length > 0 && !loading;
const handleAddUser = async () => {
  setLoading(true);
 
  if (!phone) {
    // use your snackbar/toast if available
    console.warn('Please enter a phone number');
    return;
  }
  try { 
    const payload = {  
       'first_name':firstName.trim(),
       'last_name':lastName.trim(),
        phone
     };
    console.log('Sending invite to ',payload);
    const res = await api.post('/users/invitations/send/mobile/', payload);
    const messageFromServer = res?.data?.content || '';
    setInviteMessage(messageFromServer);
    setShowSuccessModal(true);
  } catch (err) {
    console.error('Invite error:', err?.response?.data || err?.message);
    handleApiError(err);
  } finally {
    setLoading(false);
  }
};

  const handleShare = async () => {
    try {
      // Generic, cross-app share sheet
      await Share.share({
        message: inviteMessage || '',
        title: 'User Invitation',
      });
    } catch (e) {
      console.warn('Share error:', e?.message);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Header */}
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../../assets/backWhite.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add User</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* Form */}
      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>First Name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
          placeholder="Enter first name"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
          placeholder="Enter last name"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="Enter phone number"
        />

        <Text style={styles.label}>Select how user receives invite</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.inviteButton,
              inviteMethod === 'sms' && styles.inviteButtonActive,
            ]}
            onPress={() => setInviteMethod('sms')}
          >
            <Text
              style={[
                styles.inviteButtonText,
                inviteMethod === 'sms' && styles.inviteButtonTextActive,
              ]}
            >
              SMS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.inviteButton,
              inviteMethod === 'whatsapp' && styles.inviteButtonActive,
            ]}
            onPress={() => setInviteMethod('whatsapp')}
          >
            {/* <FontAwesome6 name="whatsapp" size={18} iconStyle='solid' color={inviteMethod === 'whatsapp' ? colors.primary : '#000'} /> */}
            <Image
                  source={require('../../../assets/wa.png')} 
                  style={styles.infoIcon}
                  resizeMode="contain"
              />
            <Text
              style={[
                styles.inviteButtonText,
                inviteMethod === 'whatsapp' && styles.inviteButtonTextActive,
                { marginLeft: 6 },
              ]}
            >
              Whatsapp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Button */}
        <TouchableOpacity
            style={[styles.addButton, (!canSubmit || loading) && { opacity: 0.5 }]}
            onPress={handleAddUser}
            disabled={!canSubmit || loading}
        >
            <Text style={styles.addButtonText}>{loading ? 'Sending...' : 'Add'}</Text>
        </TouchableOpacity>

        <AddUserSuccessModal
           visible={showSuccessModal}
           inviteMethod={inviteMethod}
          //  phone={phoneNumber}
           message={inviteMessage}
          //  onSendSMS={() => launchSMS(phone, inviteMessage)}
          //  onSendWhatsApp={() => launchWhatsApp(phone, inviteMessage)}
          onShare={handleShare}
          onCopy={() => handleCopyMessage(inviteMessage)}
           onAddAnother={() => {
              setShowSuccessModal(false);
              setFirstName('');
              setLastName('');
              setPhoneNumber('');
              setInviteMethod('sms');
         }}
           onCancel={() => {
              setShowSuccessModal(false);
              navigation.goBack();
           }}
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 34,
  },

  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  inviteButtonActive: {
    backgroundColor: '#E7F7E1',
    borderColor: colors.primary,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  inviteButtonTextActive: {
    color: colors.primary,
  },

  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoIcon: {
    width: 18,
    height: 18
  },
});

export default AddUser;
