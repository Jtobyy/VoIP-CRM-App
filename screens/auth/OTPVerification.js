import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback
} from 'react-native';
import AuthHeader from '../../components/AuthHeader';
import { colors } from '../../styles/global';
import AuthFooter from '../../components/AuthFooter';
import axios from 'axios';
import { Alert, ActivityIndicator } from 'react-native';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useAuth } from '../../hooks/useAuth';


const OTPVerification = ({ navigation, route }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute timer
  const inputRefs = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const { showSnackbar } = useSnackbar();
  const { login } = useAuth();
  // Get parameters with defaults
  const {
    phoneNumber = '',
    companyName = '', 
    password='',
    flowType = 'signup',
  } = route.params || {};


  const isPasswordReset = flowType === 'passwordReset';

  // Dynamic content based on flow type
  const flowConfig = {
    signup: {
      title: 'Enter Verification Code',
      subtitle: 'Verification code was sent to',
      buttonText: 'Verify',
      nextScreen: 'AccountCreated',
    },
    passwordReset: {
      title: 'Verify Your Identity',
      subtitle: 'We sent a code to verify it\'s you',
      buttonText: 'Verify',
      nextScreen: 'ForgotPassword',
    }, 
    login: {
       title: 'Enter Verification Code',
       subtitle: 'We sent a code to',
       buttonText: 'Verify',
       nextScreen: null, // we will call login() directly
  },
  };

  const { title, subtitle, buttonText, nextScreen } = flowConfig[flowType];

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Submit if last digit is entered
    if (index === 5 && value) {
      handleVerify();
    }
  };

  // Handle backspace
  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleVerify = async() => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length === 6) {
      Keyboard.dismiss();

        setVerifying(true);

      try {

    const isPasswordReset = flowType === 'passwordReset';
    const verifyUrl = isPasswordReset
      ? 'https://staging.core.nativetalkcrm.com/api/auth/mobile/forgot-password/verify-otp/'
      : 'https://staging.core.nativetalkcrm.com/api/auth/mobile/verify-otp/';

      const payload =  {
          otp: enteredOtp,
          phone_number: phoneNumber,
      }
      console.log("company name is ", companyName)
      if (companyName){
        payload.company_name = companyName
      }

      console.log("payload is ", payload)
      const res = await axios.post(verifyUrl, payload);

      if ((res?.status === 200 || res?.status === 201) && res?.data?.success) {
          if (flowType === 'login') {
             console.log('Attempting login with phone:', phoneNumber, 'and password:',password)
             await login(phoneNumber, password);
             return; // login() shows success + navigates as usual
         }
         
      if (isPasswordReset) {
        // Go to "ForgotPassword" (CreateNewPassword), pass needed params
        navigation.navigate('ForgotPassword', {
          phoneNumber,
          flowType: 'passwordReset',
        });
        return;
      }

        navigation.navigate('AccountCreated',{
          phoneNumber,
          password,
        }); // success screen
      } else {
        console.log('Verification failed: ',res)
        Alert.alert('Verification', 'OTP verification failed.');
      }
    } catch (err) {
      const msg =  'OTP verification failed.';
       console.log('response:', err?.response?.status, err?.response?.data);
      console.log('err',err)
      Alert.alert('Verification', msg);
    } finally{
      setVerifying(false)
    }
    }
  };

  const resendCode = async() => {
     if (resending || timeLeft > 0) return;
  setResending(true);
     try {
      await axios.post(
        'https://staging.core.nativetalkcrm.com/api/auth/mobile/resend-otp/',
        { phone_number: phoneNumber }
      );
      setTimeLeft(60);
      showSnackbar('OTP resent to your phone number.', 'success');
    } catch (err) {
      console.log('Resend OTP error',err)
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      'Failed to resend OTP.';
    showSnackbar(msg, 'error');
    }finally{
      setResending(false);
    }
    // Add your resend code logic here
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.rootContainer}>

        <AuthHeader 
          progress={isPasswordReset ? 2 : 2}
          totalSteps={isPasswordReset ? 2 : 3} // Different steps for reset flow
          onBack={() => navigation.goBack()}
        />

      <View style={styles.container}>
        {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {subtitle} {'\n'}
              {phoneNumber}
            </Text>
          </View>

          {/* OTP Boxes */}
          <View style={styles.otpContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={otp[index]}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Timer */}
          <Text style={styles.timer}>
            Code expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </Text>

          {/* Verify Button */}
         <TouchableOpacity
            style={[styles.button, (!otp.join('') || verifying) && styles.disabledButton]}
            onPress={handleVerify}
            disabled={!otp.join('') || verifying}
         >
         {verifying ? <ActivityIndicator /> : <Text style={styles.buttonText}>{buttonText}</Text>}
          </TouchableOpacity>

          {/* Resend Options */}
          <View style={styles.resendContainer}>
              <TouchableOpacity onPress={resendCode} disabled={resending || timeLeft > 0}>
             {resending ? (
                <ActivityIndicator />
               ) : (
               <Text style={[styles.resendText, (resending || timeLeft > 0) && styles.resendDisabled]}>
                Send code again
              </Text>
                )}
            </TouchableOpacity>
               <Text style={styles.divider}>    </Text>
             <TouchableOpacity>
               <Text style={styles.resendText}>Send to email address</Text>
            </TouchableOpacity>
           </View>

          <AuthFooter />
        </View>
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
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'start',
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 30
  },
  otpBox: {
    width: 48,
    height: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  timer: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#6CBE45',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  resendText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  divider: {
    color: '#6CBE45',
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

export default OTPVerification;