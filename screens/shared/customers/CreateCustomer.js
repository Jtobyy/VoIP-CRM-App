import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../../styles/global';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CreateCustomer = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+234',
    altPhoneNumber: '+234',
    email: '',
    address: '',
    company: '',
    comments: '',
  });

  const [showAltPhone, setShowAltPhone] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      Alert.alert(
        'Missing Information',
        'Please fill in all required fields',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate phone number format
    if (formData.phoneNumber.length < 11) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number',
        [{ text: 'OK' }]
      );
      return;
    }

    // Here you would typically call your API to create the customer
    console.log('Submitting customer data:', formData);
    
    // After successful submission, you might:
    // 1. Navigate back with the new customer data
    // 2. Show a success message
    // 3. Reset the form
    
    // For now, we'll just navigate back
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Customer</Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              placeholder="Enter first name"
              returnKeyType="next"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              placeholder="Enter last name"
              returnKeyType="next"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
              placeholder="+234"
              returnKeyType="next"
            />
          </View>

          {/* Alternative Phone Number (conditional) */}
          {showAltPhone ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alternative phone number</Text>
              <TextInput
                style={styles.input}
                value={formData.altPhoneNumber}
                onChangeText={(text) => handleInputChange('altPhoneNumber', text)}
                keyboardType="phone-pad"
                placeholder="+234"
                returnKeyType="next"
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addFieldButton}
              onPress={() => setShowAltPhone(true)}
            >
              <Icon name="add" size={20} color={colors.primary} />
              <Text style={styles.addFieldText}>Add alternative phone number</Text>
            </TouchableOpacity>
          )}

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              placeholder="Enter email address"
              returnKeyType="next"
              autoCapitalize="none"
            />
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Enter address"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Company */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Company</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => handleInputChange('company', text)}
              placeholder="Enter company name"
              returnKeyType="next"
            />
          </View>

          {/* Comments */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Comments</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={formData.comments}
              onChangeText={(text) => handleInputChange('comments', text)}
              placeholder="Enter any comments"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  addFieldText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateCustomer;