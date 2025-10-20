import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AuthHeader from '../../components/AuthHeader';
import { colors, typography } from '../../styles/global';
import AuthFooter from '../../components/AuthFooter';
import {formatPhoneNumber} from '../../utils/phone'
import axios from 'axios';
import { Alert, ActivityIndicator } from 'react-native';
import { useError } from '../../hooks/useError';
import { Modal } from 'react-native';


const PersonalInfo = ({ navigation }) => {
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [touched, setTouched] = useState({
    businessName: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [showFormBanner, setShowFormBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countryModal, setCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneLocal, setPhoneLocal] = useState('');

  const { handleApiError } = useError();
  
  const flagFor = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('nigeria')) return '🇳🇬';
    if (n.includes('kenya')) return '🇰🇪';
    if (n.includes('ghana')) return '🇬🇭';
    return '🌐';
  };

  const loadCountries = async () => {
    try {
      const res = await axios.get('https://staging.core.nativetalkcrm.com/api/users/countries');
      const list = res?.data?.countries || [];
      setCountries(list);
      // default to Nigeria if available, else first
      const ng = list.find(c => (c.name || '').toLowerCase() === 'nigeria');
      setSelectedCountry(ng || list[0] || null);
    } catch (err) {
      handleApiError(err);
    }
  };

  const formatLocal = (raw) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`;
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}${digits.slice(10) ? ' ' + digits.slice(10) : ''}`;
  };


  const handleLocalChange = (txt) => {
    const formatted = formatLocal(txt);
    setPhoneLocal(formatted);
    // Also update phoneNumber so isValid check passes
    setPhoneNumber(formatted);
  };

  useEffect(() => {
    loadCountries();
  }, []);

  const meetsRequirements = {
    length: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const passwordsMatch = password === confirmPassword && password !== '';

  const allFilled =
    businessName.trim().length > 1 &&
    phoneLocal.replace(/\D/g, '').length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const isValid =
    allFilled &&
    Object.values(meetsRequirements).every(Boolean) &&
    passwordsMatch;

  const getValidationErrors = () => {
    const e = {};

    if (!selectedCountry) e.phoneNumber = 'Please select a country.';

    const plainLocal = (phoneLocal || '').replace(/\D/g, '');
    if (!plainLocal) e.phoneNumber = 'Phone number is required.';
    if (!businessName.trim()) e.businessName = 'Business name is required.';
    
    if (!password) {
      e.password = 'Password is required.';
    } else {
      const reqs = [];
      if (!meetsRequirements.length) reqs.push('at least 8 characters');
      if (!meetsRequirements.hasUppercase) reqs.push('an uppercase letter');
      if (!meetsRequirements.hasLowercase) reqs.push('a lowercase letter');
      if (!meetsRequirements.hasDigit) reqs.push('a digit');
      if (!meetsRequirements.hasSymbol) reqs.push('a symbol');

      if (reqs.length) {
        const lastJoin = reqs.length > 1
          ? reqs.slice(0, -1).join(', ') + ' and ' + reqs.slice(-1)
          : reqs[0];
        e.password = `Password must contain ${lastJoin}.`;
      }
    }

    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (password && !passwordsMatch) {
      e.confirmPassword = 'Passwords do not match.';
    }

    return e;
  };

  const handlePhoneChange = (text) => {
    let input = text.replace(/\s/g, '');
    input = input.replace(/(?!^)\+/g, ''); 
    input = input.replace(/(?!^\+)[^\d]/g, ''); 
  
    if (input === '+') {
      setPhoneNumber('+');
      return;
    }
  
    if (input.startsWith('+234')) {
      const n = input.slice(4); 
      let out = '+234';
  
      if (n.length > 0) out += ' ' + n.slice(0, 3);
      if (n.length > 3) out += ' ' + n.slice(3, 6);
      if (n.length > 6) out += ' ' + n.slice(6, 10);
  
      if (n.length > 10) {
        const extra = n.slice(10).match(/\d{1,3}/g)?.join(' ') ?? '';
        out += ' ' + extra;
      }
  
      setPhoneNumber(out.trim());
      return;
    }
  
    if (input.startsWith('+')) {
      const rest = input.slice(1);                      
      const groups = rest.match(/\d{1,3}/g) || []; 
      setPhoneNumber('+' + groups.join(' '));
      return;
    }
  
    const groups = input.match(/\d{1,4}/g) || [];
    setPhoneNumber(groups.join(' '));
  };

  const handleProceed = async () => {
    const countryCode = selectedCountry?.phonecode;
    const plainLocalNumber = (phoneLocal || '').replace(/\D/g, '');
    const formattedPhone = `+${countryCode}${plainLocalNumber}`;

    const vErrors = getValidationErrors();
    setErrors(vErrors);
    setTouched({ businessName: true, phoneNumber: true, password: true, confirmPassword: true });

    if (Object.keys(vErrors).length > 0) {
      setShowFormBanner(true);
      return;
    }
    setShowFormBanner(false);

    if (!isValid) return;

    try {
      setSubmitting(true);
      console.log('[Proceed] submitting…', formattedPhone);
      
      const res = await axios.post(
        'https://staging.core.nativetalkcrm.com/api/auth/mobile/register/',
        { 
          phone_number: formattedPhone,
          country_id: selectedCountry?.id, 
          password
        }
      );

      if (res?.data?.success) {
        navigation.navigate('OTPVerification', {
          phoneNumber: formattedPhone,
          companyName: businessName.trim(),
          password,
          flowType: 'signup',
        });
      } else {
        Alert.alert('Sign up', res?.data?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AuthHeader 
        progress={1}
        totalSteps={3}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}  keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, typography.heading1]}>Personal</Text>
          <Text style={[styles.title, typography.heading1]}>Information</Text>
          <Text style={styles.subtitle}>Enter your details below</Text>
        </View>
        
        {/* Business Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Eze & Sons NG LTD"
            onBlur={() => setTouched(s => ({...s, businessName: true}))}
            editable={true}
          />
          {(touched.businessName && errors.businessName) && (
            <Text style={styles.errorText}>{errors.businessName}</Text>
          )}
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone number (Username)</Text>

          <View style={styles.phoneRow}>
            {/* Country code pill */}
            <TouchableOpacity
              style={styles.codePill}
              onPress={() => setCountryModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.flagDot}>
                <Text style={styles.flagText}>{flagFor(selectedCountry?.name)}</Text>
              </View>
              <Text style={styles.codeText}>
                {selectedCountry ? `+${selectedCountry.phonecode}` : '+234'}
              </Text>
              <Image
                source={require('../../assets/arrow-down.png')} 
                style={styles.codeChevron}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Local number input */}
            <TextInput
              style={[styles.input, styles.localInput]}
              value={phoneLocal}
              onChangeText={handleLocalChange}
              placeholder="803 567 0547"
              keyboardType="phone-pad"
              onBlur={() => setTouched(s => ({ ...s, phoneNumber: true }))}
            />
          </View>

          {(touched.phoneNumber && errors.phoneNumber) && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        {/* Verification Note */}
        <Text style={styles.note}>
          We will be sending a 4 digit verification code to the number provided
        </Text>
        
        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="**********"
              autoCapitalize="none"
              onBlur={() => setTouched(s => ({...s, password: true}))}
            />
            <TouchableOpacity 
              style={styles.showButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          
          {(touched.password && errors.password) && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <View style={styles.requirementsContainer}>
          <View style={styles.requirementItem}>
            <Text style={[styles.requirementText, meetsRequirements.length && styles.requirementMet]}>
              At least 8 characters
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Text style={[styles.requirementText, meetsRequirements.hasUppercase && styles.requirementMet]}>
              Contains an uppercase letter
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Text style={[styles.requirementText, meetsRequirements.hasLowercase && styles.requirementMet]}>
              Contains a lowercase letter
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Text style={[styles.requirementText, meetsRequirements.hasDigit && styles.requirementMet]}>
              Contains a number
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Text style={[styles.requirementText, meetsRequirements.hasSymbol && styles.requirementMet]}>
              Contains a symbol
            </Text>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="**********"
              autoCapitalize="none"
              onBlur={() => setTouched(s => ({...s, confirmPassword: true}))}
            />
            <TouchableOpacity 
              style={styles.showButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.showButtonText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {(touched.confirmPassword && errors.confirmPassword) && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Proceed Button */}
        <TouchableOpacity
            style={[
                styles.proceedButton,
                (!isValid || submitting) && styles.disabledButton
                ]}
              onPress={handleProceed}
                disabled={!isValid || submitting}
              >
            {submitting ? (
                  <ActivityIndicator />
                ) : (
                <Text style={styles.proceedButtonText}>Proceed</Text>
              )}
        </TouchableOpacity>
        {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        <View style={{ height: 140 }} />
        <AuthFooter />
      </ScrollView>
      <Modal
        visible={countryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModal}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select country</Text>
              <TouchableOpacity onPress={() => setCountryModal(false)}>
                <Image
                  source={require('../../assets/close_black.png')}
                  style={{ width: 20, height: 20 }}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {countries.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(c);
                    setCountryModal(false);
                  }}
                >
                  <View style={styles.countryLeft}>
                    <Text style={styles.countryFlag}>{flagFor(c.name)}</Text>
                    <Text style={styles.countryName}>{c.name}</Text>
                  </View>
                  <Text style={styles.countryCode}>(+{c.phonecode})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#F5F5F5', // Gray background for disabled inputs
  },
  note: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 20,
    textAlign: 'start',
  },
  proceedButton: {
    backgroundColor: '#6CBE45',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  signInText: {
    fontSize: 14,
    color: '#666666',
  },
  signInLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
   showButton: {
    position: 'absolute',
    right: 16,
  },
  showButtonText: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: '500',
  },
   passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#D92D20', // red
  },
  disabledButton: {
      opacity: 0.6,
  },
  requirementsContainer: {
      marginBottom: 32,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666666',
  },
  requirementMet: {
    color: '#6CBE45',
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codePill: {
    height: 50,
    minWidth: 92,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flagDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  flagText: { fontSize: 12 },
  codeText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  codeChevron: { width: 12, height: 12, marginLeft: 6 },
  
  localInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // country modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  countryModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 12,
  },
  countryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  countryLeft: { flexDirection: 'row', alignItems: 'center' },
  countryFlag: { fontSize: 18, marginRight: 10 },
  countryName: { fontSize: 16, color: '#222', fontWeight: '500' },
  countryCode: { fontSize: 14, color: '#666' },  
});

export default PersonalInfo;