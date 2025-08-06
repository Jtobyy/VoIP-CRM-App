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
import SuccessModal from '../../../components/Modals/customers/SuccessModal';
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import { pick, types } from '@react-native-documents/picker';


const AddCustomer = ({ navigation, route }) => {
  const { isFromLead, leadId, leadData } = route?.params || {};
  const [profileImage, setProfileImage] = useState(null);
  const { handleApiError } = useError();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username:'',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    company: '',
    comments: '',
    // You can add extra fields here: instagram, gender, etc.
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const { setLoading } = useLoading();
  const { api } = useApi();

  useEffect(() => {
    // If we have leadData, prefill immediately
    if (isFromLead && leadData) {
      prefillFromLead(leadData);
    }
    // If we only have leadId, fetch from API
    else if (isFromLead && leadId) {
      fetchLeadData(leadId);
    }
    // eslint-disable-next-line
  }, [isFromLead, leadId, leadData]);

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
  const prefillFromLead = (lead) => {
    // Defensive splitting of name
    let firstName = '';
    let lastName = '';
    if (lead?.name) {
      const parts = lead.name.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
    setForm({
      firstName: lead?.first_name || firstName,
      lastName: lead?.last_name || lastName,
      phone: lead?.phone || lead?.unique_identifier || '',
      altPhone: '',
      email: lead?.email || '',
      address: lead?.address || '',
      company: lead?.company || '',
      comments: '',
      // Add extra fields here if you want
    });
  };

  const fetchLeadData = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/leads/${id}/`);

      const lead = res?.data?.lead;

      if (lead) {
        prefillFromLead(lead);
      } else {
        Alert.alert('Lead not found', 'Could not fetch lead details');
      }
    } catch (err) {
      console.log('err is ', err)
      console.log('err response is ', err.response)

      Alert.alert('Error', 'Error fetching lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    setLoading(true);
    try {
      let response;
      // Use FormData!
      const formData = new FormData();
      formData.append('first_name', form.firstName);
      formData.append('last_name', form.lastName);
      formData.append('username',form.username);
      formData.append('phone_number', form.phone);
      formData.append('email', form.email);
      formData.append('address', form.address);
      formData.append('company', form.company);
      formData.append('comments', form.comments);

      if (profileImage) {
        formData.append('image', {
          uri: profileImage.uri,
          name: profileImage.name,
          type: profileImage.type || 'image/jpeg',
        });
      }

      if (isFromLead && leadId) {
        await api.post(`/customers/leads/${leadId}/convert/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // Normal customer creation (likely still JSON unless also requires FormData)
        await api.post(`/customers/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      console.log("SET SHOW SUCCESS TRUE"); // <------
      setShowSuccess(true);
      console.log("showSuccess set");
    } catch (err) {console.log('err res is ', err.response)
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
          <Text style={styles.headerTitle}>New Customer</Text>
          <View style={styles.headerRight} />
        </ImageBackground>

        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarCircle} onPress={pickProfileImage}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage.uri }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
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
      </ScrollView>
      <SuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </View>
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
