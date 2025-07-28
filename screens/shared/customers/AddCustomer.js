import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ImageBackground
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import SuccessModal from '../../../components/Modals/customers/SuccessModal';


const AddCustomer = ({ navigation }) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    company: '',
    comments: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddCustomer = () => {
    // show modal
    setShowSuccess(true);
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <ImageBackground 
            source={require('../../../assets/header_bg.png')}
            style={styles.header}
            resizeMode="cover"
          >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Image
              source={require('../../../assets/backWhite.png')} 
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Customer</Text>
          <View style={styles.headerRight} />
      </ImageBackground>

      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <FontAwesome6 name="camera" iconStyle='solid' size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
            style={styles.input}
            value={form.firstName}
            onChangeText={(val) => handleChange('firstName', val)}
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(val) => handleChange('lastName', val)}
        />

        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
            <FontAwesome6 name="circle-dot" size={16} color={colors.primary} />
            <Text style={styles.codeText}>+234</Text>
            </View>
            <TextInput
            style={styles.flexInput}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(val) => handleChange('phone', val)}
            />
        </View>

        <Text style={styles.label}>Add alternative phone number</Text>
        <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
            <FontAwesome6 name="circle-dot" size={16} color={colors.primary} />
            <Text style={styles.codeText}>+234</Text>
            </View>
            <TextInput
            style={styles.flexInput}
            keyboardType="phone-pad"
            value={form.altPhone}
            onChangeText={(val) => handleChange('altPhone', val)}
            />
        </View>

        <Text style={styles.label}>Email address</Text>
        <TextInput
            style={styles.input}
            keyboardType="email-address"
            value={form.email}
            onChangeText={(val) => handleChange('email', val)}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={(val) => handleChange('address', val)}
        />

        <Text style={styles.label}>Company</Text>
        <TextInput
            style={styles.input}
            value={form.company}
            onChangeText={(val) => handleChange('company', val)}
        />

        <Text style={styles.label}>Comments</Text>
        <TextInput
            multiline
            numberOfLines={5}
            style={[styles.input, styles.textArea]}
            value={form.comments}
            onChangeText={(val) => handleChange('comments', val)}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleAddCustomer}>
          <Text style={styles.primaryText}>Add Customer</Text>
        </TouchableOpacity>


        <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
        >
            <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        </View>

        <SuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </ScrollView>
  );
};

export default AddCustomer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  avatarCircle: {
    backgroundColor: '#E7F7E1',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    height: 48,
  },
  codeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  flexInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  cancelText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  backButtonIcon: {
    width: 20,
    height: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
  },
  
});
