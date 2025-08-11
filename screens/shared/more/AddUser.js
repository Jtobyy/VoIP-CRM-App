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
} from 'react-native';
import { colors } from '../../../styles/global';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AddUserSuccessModal from '../../../components/Modals/more/AddUserSuccessModal';


const AddUser = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inviteMethod, setInviteMethod] = useState('sms'); // sms or whatsapp
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  const handleAddUser = () => {
    // submit user creation logic
    console.log({ firstName, lastName, phoneNumber, inviteMethod });
    setShowSuccessModal(true);
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>

        <AddUserSuccessModal
          visible={showSuccessModal}
          onAddAnother={() => {
            setShowSuccessModal(false);
            setFirstName('');
            setLastName('');
            setPhoneNumber('');
            setInviteMethod('sms');
          }}
          onCancel={() => {
            setShowSuccessModal(false);
            navigation.goBack(); // or keep user on same page
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
