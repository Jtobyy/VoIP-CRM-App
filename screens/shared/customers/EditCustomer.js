import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ImageBackground,
  Alert
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import SuccessModal from '../../../components/Modals/customers/EditSuccessModal';
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import { pick, types } from '@react-native-documents/picker';
import RNPickerSelect from 'react-native-picker-select';


const EditCustomer = ({ navigation, route }) => {
  const { customerId } = route.params;
  const [profileImage, setProfileImage] = useState(null);
  const { handleApiError } = useError();

  const [customer, setCustomer] = useState(null);

useEffect(() => {
  if (customerId) {
    fetchCustomerData();
  }
}, [customerId]);

const fetchCustomerData = async () => {
  setLoading(true);
  try {
    const res = await api.get(`/customers/${customerId}/`);
    const data = res.data.customer;

    setCustomer(data);
    console.log(data)

    setForm({
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      username: data.username || '',
      phone: data.phone_number || '',
      email: data.email || '',
      gender: data.gender || '',
      instagram: data.instagram || '',
      facebook: data.facebook || '',
      whatsapp: data.whatsapp || '',
      tiktok: data.tiktok || '',
      tags: data.tags || [],
    });

    if (data.image) {
      setProfileImage({ uri: data.image });
    }

  } catch (err) {
    handleApiError(err);
  } finally {
    setLoading(false);
  }
};


  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username:'',
    phone: '',
    email: '',
    gender:  '',
    instagram:  '',
    facebook:  '',
    whatsapp: '',
    tiktok: '',
    // You can add extra fields here: instagram, gender, etc.
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const { setLoading } = useLoading();
  const { api } = useApi();

  const pickProfileImage = async () => {
    try {
      // Only allow image types
      const result = await pick({ type: [types.images] });
      if (result && result.length > 0) {
        setProfileImage({
          uri: result[0].uri,
          name: result[0].name,
          type: result[0].type,
        });
      }
    } catch (err) {
      console.error('Profile image pick error', err);
    }
  };
  

const handleEditCustomer = async () => {
  setLoading(true);
  try {
    const formDataToSend = new FormData();

    formDataToSend.append('first_name', form.firstName);
    formDataToSend.append('last_name', form.lastName);
    formDataToSend.append('username', form.username);
    formDataToSend.append('phone_number', form.phone);
    formDataToSend.append('email', form.email);
    formDataToSend.append('gender', form.gender);
    formDataToSend.append('instagram', form.instagram);
    formDataToSend.append('facebook', form.facebook);
    formDataToSend.append('whatsapp', form.whatsapp);
    formDataToSend.append('tiktok', form.tiktok);
    form.tags?.forEach(tag => formDataToSend.append('tags', tag.id)); // assumes tags is an array of {id, label}

    if (profileImage && profileImage.uri && profileImage.name) {
      formDataToSend.append('image', {
        uri: profileImage.uri,
        name: profileImage.name,
        type: profileImage.type,
      });
    }

    await api.patch(`/customers/${customerId}/`, formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setShowSuccess(true);
  } catch (err) {
    console.log('err res is ', err.response);
    handleApiError(err);
  } finally {
    setLoading(false);
  }
};


  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <View style={styles.container} >
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
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../../../assets/backWhite.png')}
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <View style={styles.headerRight} />
        </ImageBackground>

        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarCircle} onPress={pickProfileImage}>
            {profileImage ?  (
    <View>
      <Image
        source={{ uri: profileImage?.uri || customer?.image }}
        style={{ width: 80, height: 80, borderRadius: 40 }}
      />
      <View style={styles.overlayIcon}>
        <FontAwesome6 name="camera" size={16} iconStyle='solid' color="#fff" />
      </View>
    </View>
  ): (
              <FontAwesome6 name="camera" iconStyle="solid" size={32} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* ...All your inputs remain the same, just controlled with form state... */}
          {/* ... */}
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
              <TextInput
                  style={styles.input}
                  value={form.phone}
                 onChangeText={(val) => handleChange('phone', val)}
               />

           <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={form.username}
            onChangeText={(val) => handleChange('username', val)}
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput
              style={styles.input}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(val) => handleChange('email', val)}
          />

           <Text style={styles.label}>Gender</Text>
         <View style={styles.input}>
           <RNPickerSelect
               onValueChange={(value) => handleChange('gender', value)}
               items={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                  ]}
               value={form.gender}
               
               placeholder={{ label: 'Select gender', value: null }}
               style={{
                  inputIOS: { color: '#000' },
                  inputAndroid: { color: '#000' },
                  placeholder: { color: '#999' }
             }}
              />
        </View>

          <Text style={styles.label}>Instagram</Text>
          <TextInput
              style={styles.input}
              value={form.instagram}
              onChangeText={(val) => handleChange('instagram', val)}
          />

          <Text style={styles.label}>Facebook</Text>
          <TextInput
              style={styles.input}
              value={form.facebook}
              onChangeText={(val) => handleChange('facebook', val)}
          />

          <Text style={styles.label}>WhatsApp</Text>
          <TextInput
              style={styles.input}
              value={form.whatsapp}
              onChangeText={(val) => handleChange('whatsapp', val)}
          />

          <Text style={styles.label}>Tiktok</Text>
          <TextInput
              style={styles.input}
              value={form.tiktok}
              onChangeText={(val) => handleChange('tiktok', val)}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleEditCustomer}>
            <Text style={styles.primaryText}>Edit Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <SuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </View>
  );
};

export default EditCustomer;


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
  overlayIcon: {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  borderRadius: 10,
  padding: 4,
}

});
