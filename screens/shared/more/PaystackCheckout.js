// screens/shared/more/PaystackCheckout.js
import React, { useCallback, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import { CommonActions } from '@react-navigation/native';
import WalletTopUpSuccessModal from '../../../components/Modals/more/WalletTopUpSuccessModal';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';


function getRefFromUrl(url) {
  try {
    const q = url.split('?')[1] || '';
    const pairs = q.split('&').filter(Boolean).map(p => p.split('=').map(decodeURIComponent));
    const map = Object.fromEntries(pairs);
    return map.reference || map.trxref || null;
  } catch { return null; }
}

const PaystackCheckout = ({ route, navigation }) => {
  const { 
    url, 
    reference: initRef,
    subscriptionId,
    totalAmount,
    isWalletTopUp = false, // wallet top-up flag
    isCallCredit = false // call credit flag
  } = route.params || {};
  
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();
  const verifying = useRef(false);
  
  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  const finishToMore = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
    navigation.navigate('Main', { screen: 'More' });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    finishToMore();
  };

  const verifyAndClose = useCallback(async (ref) => {
    if (verifying.current) return;
    verifying.current = true;
    
    try {
      setLoading(true);
      
      if (isWalletTopUp) {
        // Wallet top-up verification
        const response = await api.post('/billings/wallet/fund/verify/', { 
          reference: ref 
        });
        
        if (response.data?.success) {
          setVerificationData({
            amount: totalAmount,
            walletBalance: response.data.wallet_balance,
            message: response.data.message
          });
          setShowSuccessModal(true);
        }
      } 
      else if (isCallCredit) {
        // Call credit payment verification - FIXED ENDPOINT
        const response = await api.post('/billings/pbx-credits/verify/', {
          reference: ref
        });
        
        if (response.data?.success) {
          Alert.alert(
            'Purchase Successful',
            `${response.data.message}\n\nAmount: ₦${Number(response.data.amount).toLocaleString()}\n${response.data.pbx_response || ''}`,
            [{ text: 'OK', onPress: finishToMore }]
          );
        } else {
          handleApiError(new Error('Verification failed'));
          navigation.goBack();
        }
      } else {
        // Subscription payment verification - FIXED ENDPOINT
        const response = await api.post('/billings/subscriptions/select-plan/verify/', {
          reference: ref
        });
        
        if (response.data?.success) {
          // Navigate to PaymentSuccess screen with subscription details
          navigation.navigate('PaymentSuccess', {
            reference: ref,
            amount: totalAmount,
            subscriptionId: subscriptionId,
            paymentMethod: 'paystack',
            subscription: response.data.subscription,
          });
        } else {
          Alert.alert(
            'Verification Failed',
            response.data?.message || 'Unable to verify payment. Please contact support.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (e) {
      console.error('Payment verification error:', e);
      handleApiError(e);
      navigation.goBack();
    } finally {
      setLoading(false);
      verifying.current = false;
    }
  }, [api, navigation, setLoading, handleApiError, isWalletTopUp, isCallCredit, totalAmount, subscriptionId]);

  // Intercept BEFORE loading the page
  const onShouldStart = useCallback((request) => {
    const u = request?.url || '';
    if (u.includes('reference=') || u.includes('trxref=')) {
      const ref = getRefFromUrl(u) || initRef;
      verifyAndClose(ref);
      return false;
    }
    return true;
  }, [initRef, verifyAndClose]);

  // Fallback for platforms where onShouldStart fires late
  const onNavChange = useCallback((navState) => {
    const u = navState?.url || '';
    if (u.includes('reference=') || u.includes('trxref=')) {
      const ref = getRefFromUrl(u) || initRef;
      verifyAndClose(ref);
    }
  }, [initRef, verifyAndClose]);

  return (
    <View style={{ flex: 1 }}>
      {/* Minimal header with a Close */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.close}>Close</Text>
        </TouchableOpacity>
      </View>

      <WebView
        source={{ uri: url }}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={onNavChange}
        startInLoadingState
        renderLoading={() => (
          <View style={s.loader}><ActivityIndicator size="large" /></View>
        )}
      />

      {/* Success Modal for Wallet Top-up */}
      {isWalletTopUp && verificationData && (
        <WalletTopUpSuccessModal
          visible={showSuccessModal}
          amount={verificationData.amount}
          walletBalance={verificationData.walletBalance}
          onClose={handleSuccessModalClose}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  header: { height: 48, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },
  close: { color: '#111', fontSize: 16 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default PaystackCheckout;