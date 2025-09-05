import React, { useState } from 'react';
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
import { colors, containers } from '../../styles/global';
import { typography } from '../../styles/global';
import AuthFooter from '../../components/AuthFooter';
import AuthHeader from '../../components/AuthHeader';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useLoading } from '../../hooks/useLoading';
import axios from 'axios';
import { useError } from '../../hooks/useError'

const CreateNewPassword = ({ navigation, route }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const { showSnackbar } = useSnackbar();
    const {handleApiError} = useError()
  
    const { setLoading } = useLoading();
     const { phoneNumber = '', flowType = 'passwordReset' } = route.params || {};
  
 const handleSubmit = async () => {
    // basic guards
    if (!phoneNumber) {
      showSnackbar('Missing phone number. Please restart the reset flow.', 'error');
      return;
    }
    if (!meetsRequirements.length || !meetsRequirements.hasNumberOrSymbol) {
      showSnackbar('Password must be at least 8 characters and include a number or symbol.', 'error');
      return;
    }
    if (!passwordsMatch) {
      showSnackbar('Passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        'https://staging.core.nativetalkcrm.com/api/auth/mobile/forgot-password/change-password/',
        {
          phone_number: phoneNumber,
          new_password: password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if ([200, 201].includes(res?.status) && res?.data?.success) {
        showSnackbar(res?.data?.message || 'Password changed successfully.', 'success');
        navigation.navigate('PasswordChanged', {
          phoneNumber,
          flowType, // keep passing in case you need it there
        });
      } else {
        showSnackbar('Could not change password. Please try again.', 'error');
      }
    } catch (err) {
      // server may return 400 with a useful error string
      const specific =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.detail;
      if (specific) {
        showSnackbar(specific, 'error');
      } else {
        handleApiError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  // Password requirements validation
  const meetsRequirements = {
    length: password.length >= 8,
    hasNumberOrSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?0-9]/.test(password),
  };

  const passwordsMatch = password === confirmPassword && password !== '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={containers.rootContainer}>
          <AuthHeader 
            progress={3}
            totalSteps={3}
            onBack={() => navigation.goBack()}
          />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, typography.heading1]}>
              Create a new password
            </Text>
            <Text style={styles.subtitle}>Secure password rules</Text>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementItem}>
              <Text style={styles.requirementText}>Must not contain your name or email</Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, meetsRequirements.length && styles.requirementMet]}>
                At least 8 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, meetsRequirements.hasNumberOrSymbol && styles.requirementMet]}>
                Contains a symbol or a number
              </Text>
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.showButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
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
                placeholder="Confirm your password"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.showButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.showButtonText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, !passwordsMatch && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!passwordsMatch}
          >
            <Text style={styles.submitButtonText}>
              Change Password
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <AuthFooter />
        </ScrollView>
      </View>
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
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.primary,
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
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
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
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#6CBE45',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 30
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
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
  whatsappButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  whatsappText: {
    fontSize: 14,
    color: '#6CBE45',
    fontWeight: '500',
  },
});

export default CreateNewPassword;