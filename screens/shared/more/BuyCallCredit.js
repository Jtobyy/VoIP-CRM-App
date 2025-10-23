import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const BuyCallCredit = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  // Enable when: only digits and > 0
  const canPay = /^\d+$/.test(amount) && parseInt(amount, 10) > 0 && selectedPaymentMethod;

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const res = await api.get('/billings/wallet/');
      if (res.data?.success && res.data?.wallet?.balance !== undefined) {
        setWalletBalance(res.data.wallet.balance);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  // Payment methods
  const paymentMethods = [
    {
      id: 'wallet',
      label: `Pay via Wallet (Balance: ₦${walletBalance.toLocaleString()})`,
      value: 'wallet',
      disabled: walletBalance < parseInt(amount || 0),
    },
    {
      id: 'paystack',
      label: 'Pay via Debit/credit card',
      value: 'paystack',
      disabled: false,
    }
  ];

  const handlePaymentMethodSelect = (method) => {
    if (method.disabled) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than the required amount (₦${amount}). Please fund your wallet or use card payment.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedPaymentMethod(method.id);
  };

  const handleWalletPayment = async () => {
    try {
      setLoading(true);
      const payload = {
        amount: parseFloat(amount),
        payment_method: 'wallet'
      };

      const res = await api.post('/billings/pbx-credits/buy/', payload);

      if (res.data?.success) {
        Alert.alert(
          'Purchase Successful',
          `Call credit purchased successfully!\nAmount: ₦${res.data.amount?.toLocaleString()}\nNew Credit Balance: ${res.data.new_credit_balance?.toLocaleString()} credits\nNew Wallet Balance: ₦${res.data.wallet_balance?.toLocaleString()}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      if (error.response?.data?.error === 'Insufficient wallet balance') {
        const errorData = error.response.data;
        Alert.alert(
          'Insufficient Wallet Balance',
          `Wallet Balance: ₦${errorData.wallet_balance?.toLocaleString()}\nRequired Amount: ₦${errorData.required_amount?.toLocaleString()}\nShortfall: ₦${errorData.shortfall?.toLocaleString()}\n\n${errorData.message}`,
          [
            {
              text: 'Use Card Payment',
              onPress: () => setSelectedPaymentMethod('paystack')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        handleApiError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    try {
      setLoading(true);
      const payload = {
        amount: parseFloat(amount),
        payment_method: 'paystack'
      };

      const res = await api.post('/billings/pbx-credits/buy/', payload);

      if (res.data?.success) {
        const { authorization_url, reference } = res.data;
        navigation.navigate('PaystackCheckout', {
          url: authorization_url,
          reference,
          isCallCredit: true,
          totalAmount: parseFloat(amount)
        });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!canPay) return;

    if (selectedPaymentMethod === 'wallet') {
      await handleWalletPayment();
    } else if (selectedPaymentMethod === 'paystack') {
      await handlePaystackPayment();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      {/* Header */}
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../../assets/backWhite.png')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Buy Call Credit</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Enter amount</Text>

          {/* Amount input */}
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ''))}
              placeholder="1000"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={9}
              style={styles.amountInput}
            />
          </View>

          <Text style={styles.infoText}>
            1 credit = ₦1. Purchase call credits to make calls through the platform.
          </Text>

          {/* Payment Method Section */}
          <View style={styles.paymentMethodSection}>
            <Text style={styles.paymentMethodTitle}>Payment method</Text>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  method.disabled && amount && styles.paymentMethodCardDisabled
                ]}
                onPress={() => handlePaymentMethodSelect(method)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentMethodContent}>
                  <Text style={[
                    styles.paymentMethodLabel,
                    method.disabled && amount && styles.paymentMethodLabelDisabled
                  ]}>
                    {method.label}
                  </Text>
                  {method.disabled && amount && (
                    <Text style={styles.insufficientText}>Insufficient balance</Text>
                  )}
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && styles.radioButtonSelected,
                  method.disabled && amount && styles.radioButtonDisabled
                ]}>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Floating bottom button */}
        <View style={styles.footer}>
          <TouchableOpacity
            disabled={!canPay}
            style={[styles.payBtn, !canPay && styles.payBtnDisabled]}
            onPress={handlePay}
          >
            <Text style={styles.payText}>Buy Credit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  backButtonIcon: { width: 20, height: 20 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { width: 34 },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 160,
  },
  label: { fontSize: 16, color: '#222', marginBottom: 10, fontWeight: '600' },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    paddingHorizontal: 14,
    height: 56,
    elevation: 1,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
    fontWeight: '600',
  },
  amountInput: { flex: 1, fontSize: 18, color: '#111' },

  infoText: {
    color: '#5B5B5B',
    marginTop: 18,
    lineHeight: 20,
    fontSize: 14,
  },

  paymentMethodSection: {
    marginTop: 32,
    marginBottom: 20,
  },

  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },

  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  paymentMethodCardDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },

  paymentMethodContent: {
    flex: 1,
  },

  paymentMethodLabel: {
    fontSize: 16,
    color: '#333',
  },

  paymentMethodLabelDisabled: {
    color: '#999',
  },

  insufficientText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },

  radioButtonDisabled: {
    borderColor: '#DDD',
  },

  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  payBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#29B110',
    elevation: 3,
  },
  payBtnDisabled: { backgroundColor: '#A7D6A6' },
  payText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default BuyCallCredit;