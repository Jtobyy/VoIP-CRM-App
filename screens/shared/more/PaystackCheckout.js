// screens/shared/more/PaystackCheckout.js
import React, { useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import { CommonActions } from '@react-navigation/native';

function getRefFromUrl(url) {
  try {
    const q = url.split('?')[1] || '';
    const pairs = q.split('&').filter(Boolean).map(p => p.split('=').map(decodeURIComponent));
    const map = Object.fromEntries(pairs);
    return map.reference || map.trxref || null;
  } catch { return null; }
}

const PaystackCheckout = ({ route, navigation }) => {
  const { url, reference: initRef } = route.params || {};
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();
  const verifying = useRef(false); // avoid double-submit

 const finishToMore = () => {
  // 1) Clear the stack to the Tabs container
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  );
  // 2) Select the More tab
  navigation.navigate('Main', { screen: 'More' });
};

  const verifyAndClose = useCallback(async (ref) => {
    if (verifying.current) return;
    verifying.current = true;
    try {
      setLoading(true);
      // await api.post('/billings/wallet/fund/verify/', { reference: ref });
      finishToMore();
    } catch (e) {
      handleApiError(e);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [api, navigation, setLoading, handleApiError]);

  // Intercept BEFORE loading the page (prevents showing that 404)
  const onShouldStart = useCallback((request) => {
    const u = request?.url || '';
    if (u.includes('reference=') || u.includes('trxref=')) {
      const ref = getRefFromUrl(u) || initRef;
      verifyAndClose(ref);
      return false; // cancel navigation; we’re handling it
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
    </View>
  );
};

const s = StyleSheet.create({
  header: { height: 48, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },
  close: { color: '#111', fontSize: 16 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default PaystackCheckout;
