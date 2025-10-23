import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { colors } from '../../styles/global';
import { useAuth } from '../../hooks/useAuth';
import AuthFooter from '../../components/AuthFooter';
import AuthHeader from '../../components/AuthHeader';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useLoading } from '../../hooks/useLoading';
import axios from 'axios';
import { useError } from '../../hooks/useError'
import {formatPhoneNumber} from '../../utils/phone'


const { width } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const { login, isAuthenticated } = useAuth();
  const {company} = useAuth()
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const { showSnackbar } = useSnackbar();
  const {handleApiError} = useError()

  const { setLoading } = useLoading();

  const handlePhoneChange = (text) => {
    let input = text.replace(/\s/g, '');
    input = input.replace(/(?!^)\+/g, ''); 
    input = input.replace(/(?!^\+)[^\d]/g, ''); 

    if (input === '+') {
      setUsername('+');
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

      setUsername(out.trim());
      return;
    }

    if (input.startsWith('+')) {
      const rest = input.slice(1);                      
      const groups = rest.match(/\d{1,3}/g) || []; 
      setUsername('+' + groups.join(' '));
      return;
    }

    const groups = input.match(/\d{1,4}/g) || [];
    setUsername(groups.join(' '));
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login(formatPhoneNumber(username), password, navigation);
    } finally {
      setLoading(false);
    }
  };

 const handleForgotPassword = async () => {
  if (!username || username.trim() === '') {
    showSnackbar('Phone number is required.', 'error');
    return;
  }

  try {
    setLoading(true);
    const formattedPhone = formatPhoneNumber(username);

    const res = await axios.post(
      'https://staging.core.nativetalkcrm.com/api/auth/mobile/forgot-password/send-otp/',
      { phone_number: formattedPhone },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res?.data?.success) {
      showSnackbar(res.data.message || 'OTP sent to your phone number.', 'success');

      navigation.navigate('OTPVerification', {
        phoneNumber: formattedPhone,
        flowType: 'passwordReset',
      });
    }
  } catch (err) {
    if (err?.response?.status === 404) {
      showSnackbar('No account associated with this phone number.', 'error');
    } else {
      showSnackbar(err?.response?.data || 'Failed to reset password!', 'error');
      handleApiError(err);
    }
  } finally {
    setLoading(false);
  }
};


  const handleCreateAccount = () => {
    navigation.navigate('PersonalInfo');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.rootContainer}>
          <AuthHeader 
            progress={0}
            totalSteps={3}
            onBack={() => navigation.goBack()}
          />
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>              
              {/* Header */}
              <View >
                <Text style={styles.welcomeText}>Welcome Back,</Text>
              </View>

              {/* Username Input */}
              <View style={styles.userNameContainer}>
                <Text style={styles.inputLabel}>Username (phone number)</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  placeholder="+234 803 567 0547"
                  placeholderTextColor="#98A2B3"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassword}>Forgot Password</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="**********"
                    placeholderTextColor="#98A2B3"
                  />
                  <TouchableOpacity 
                    style={styles.showButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.showButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account </Text>
                <TouchableOpacity onPress={handleCreateAccount}>
                  <Text style={styles.footerLink}>Create an account</Text>
                </TouchableOpacity>
              </View>

              {/* WhatsApp Chat */}
              <AuthFooter />
            </View>
          </ScrollView>
        </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },
  companyText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
    marginTop: 1,
  },
  inputContainer: {
    marginBottom: 60,
  },
  userNameContainer: {
    marginTop: 60,
    marginBottom: 25
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333333',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
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
  loginButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  altLoginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#6CBE45',
  },
  altLoginText: {
    color: '#6CBE45',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  footerLink: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  whatsappButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: 'rgb(242, 246, 252)'
  },
  whatsappIcon: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  whatsappText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
});

export default Login;