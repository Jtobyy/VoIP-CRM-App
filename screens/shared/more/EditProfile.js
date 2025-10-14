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
import SuccessModal from '../../../components/Modals/profile/EditProfileModal';
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import { pick, types } from '@react-native-documents/picker';
import {formatDateTime} from '../../../utils/timeUtils'
import RNPickerSelect from 'react-native-picker-select';


const EditProfile = ({ navigation }) => {
  
  const [profileImage, setProfileImage] = useState(null);
  const { handleApiError } = useError();

  const [user, setUser] = useState(null);

useEffect(() => {
  fetchUserProfile();
}, []);

const fetchUserProfile = async () => {
  setLoading(true);
  try {
    const res = await api.get(`/users/me`);
    const data = res.data.user;

    setUser(data);
    console.log(data)

    setForm({
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      phone: data.phone_number || '',
      email: data.email || '',
      gender: data.gender || '',
      created_at:formatDateTime(data.created_at) || '',
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
    phone: '',
    email: '',
    gender:  '',
    created_at:'',
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
  

const handleEditProfile = async () => {
  setLoading(true);
  try {
    const formDataToSend = new FormData();

    formDataToSend.append('first_name', form.firstName);
    formDataToSend.append('last_name', form.lastName);
    formDataToSend.append('phone_number', form.phone);
    formDataToSend.append('gender', form.gender);
  

    if (profileImage && profileImage.uri && profileImage.name) {
      formDataToSend.append('image', {
        uri: profileImage.uri,
        name: profileImage.name,
        type: profileImage.type,
      });
    }

    await api.put(`/users/me/update/`, formDataToSend, {
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
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

        <Text style={styles.label}>Username (Phone number)</Text>
        <TextInput
            style={[styles.input,styles.disabledInput]}
            value={form.phone}
            editable={false}
            onChangeText={(val) => handleChange('phone', val)}
        />


          <Text style={styles.label}>Email address</Text>
          <TextInput
              style={[styles.input,styles.disabledInput]}
              value={form.email}
              keyboardType="email-address"
              editable={false}
          />

            <Text style={styles.label}>Account Creation Date</Text>
          <TextInput
              style={[styles.input,styles.disabledInput]}
              value={form.created_at}
              editable={false}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleEditProfile}>
            <Text style={styles.primaryText}>Save Changes</Text>
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

export default EditProfile;


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
},
disabledInput: {
  backgroundColor: '#f3f4f6', // light gray
  color: '#9ca3af', // darker gray text
}

});
