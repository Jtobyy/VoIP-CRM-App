import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Image, ImageBackground, TextInput, KeyboardAvoidingView, Platform,
  SafeAreaView
} from 'react-native';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import ConfirmTopUpModal from '../../../components/Modals/more/ConfirmTopUpModal';

const AddFunds = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  // Enable when: only digits and > 0
  const canPay = /^\d+$/.test(amount) && parseInt(amount, 10) > 0;

   const initiateTopUp = async () => {
    try {
      setLoading(true);
      // 1) Initiate
      const payload = { amount: parseFloat(amount) }; // backend expects decimal
      const res = await api.post('/billings/wallet/fund/initiate/', payload);
      const { authorization_url, reference } = res.data;

      // 2) Go to WebView and watch for redirect (we’ll verify there)
      navigation.navigate('PaystackCheckout', { url: authorization_url, reference });
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
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

        <Text style={styles.headerTitle}>Add Funds</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Enter specific amount</Text>

          {/* Amount input + VISA/MC badge */}
          <View style={styles.amountRow}>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ''))} // digits only
              placeholder="3000"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={9}
              style={styles.amountInput}
            />
            <Image
              source={require('../../../assets/cardgroup.png')}
              style={styles.inlineBrand}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.infoText}>
            You’ll be redirected to a secure Paystack checkout to enter your payment details.
          </Text>

          <Image
            source={require('../../../assets/secure_payment.png')}
            style={styles.paystackStrip}
            resizeMode="contain"
          />
        </ScrollView>

        {/* Floating bottom button (not hugging the OS navbar) */}
        <View style={styles.footer}>
          <TouchableOpacity
            disabled={!canPay}
            style={[styles.payBtn, !canPay && styles.payBtnDisabled]}
            onPress={() => setShowConfirm(true)}  
          >
            <Text style={styles.payText}>Pay</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <ConfirmTopUpModal
        visible={showConfirm}
        amount={amount}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          initiateTopUp();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    paddingTop: 80, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  backButtonIcon: { width: 20, height: 20 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#ffffff', flex: 1, textAlign: 'center' },
  headerRight: { width: 34 },

  content: {
    paddingHorizontal: 20, paddingTop: 24,
    paddingBottom: 160, // room for the floating button
  },
  label: { fontSize: 16, color: '#222', marginBottom: 10 },

  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#E6E8EC',
    paddingHorizontal: 14, height: 56,
    elevation: 1,
  },
  amountInput: { flex: 1, fontSize: 18, color: '#111' },
  inlineBrand: { width: 60, height: 24, marginLeft: 12 },

  infoText: { color: '#5B5B5B', marginTop: 18, lineHeight: 20 },

  paystackStrip: { width: 220, height: 40, alignSelf: 'center', marginTop: 22 },

  // Floating action area
  footer: {
    position: 'absolute',
    left: 20, right: 20,
    bottom: 24, // lifts above the nav bar to match the mock
  },
  payBtn: {
    height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#29B110',
    elevation: 3,
  },
  payBtnDisabled: { backgroundColor: '#A7D6A6' },
  payText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddFunds;

