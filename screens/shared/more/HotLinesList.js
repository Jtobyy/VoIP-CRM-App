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
  Modal,
  Alert,
} from 'react-native';
import { colors } from '../../../styles/global';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';

const HotlinesList = ({ navigation }) => {
  const [dids, setDids] = useState([]);
  const [selectedDids, setSelectedDids] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  // Image mapping
  const imageMap = {
    lightgreenct: require('../../../assets/lightgreenct.png'),
    lightbluect: require('../../../assets/lightbluect.png'),
    lightorangect: require('../../../assets/lightorangect.png'),
  };

  // Color schemes for DID cards
  const cardColors = [
    { bg: '#4CAF50', icon: '#2E7D32', headerBg: '#66BB6A', image: 'lightgreenct' },
    { bg: '#2196F3', icon: '#1565C0', headerBg: '#42A5F5', image: 'lightbluect' },
    { bg: '#FF7043', icon: '#D84315', headerBg: '#FF8A65', image: 'lightorangect' },
    { bg: '#66BB6A', icon: '#388E3C', headerBg: '#81C784', image: 'lightgreenct' },
    { bg: '#42A5F5', icon: '#1976D2', headerBg: '#64B5F6', image: 'lightbluect' },
    { bg: '#FF8A65', icon: '#E64A19', headerBg: '#FFAB91', image: 'lightorangect' },
  ];

  // Price per DID (monthly recurring)
  const PRICE_PER_DID = 2500;

  const fetchDids = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/call-center/pbx/available-dids/`);
      setDids(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch DIDs:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchDids();
    fetchWalletBalance();
  }, []);

  const handleDidSelect = (did) => {
    setSelectedDids(prev => {
      const exists = prev.find(d => d.id === did.id);
      if (exists) {
        return prev.filter(d => d.id !== did.id);
      } else {
        return [...prev, did];
      }
    });
  };

  const totalAmount = selectedDids.length * PRICE_PER_DID;

  const paymentMethods = [
    {
      id: 'wallet',
      label: `Pay via Wallet (Balance: ₦${walletBalance.toLocaleString()})`,
      value: 'wallet',
      disabled: walletBalance < totalAmount,
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
        `Your wallet balance (₦${walletBalance.toLocaleString()}) is less than the required amount (₦${totalAmount.toLocaleString()}). Please fund your wallet or use card payment.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedPaymentMethod(method.id);
  };

  const handleWalletPayment = async (payload) => {
    try {
      const res = await api.post('/billings/dids/purchase/', payload);

      if (res.data?.success) {
        Alert.alert(
          'Payment Successful',
          `DIDs purchased successfully!\nAmount charged: ₦${res.data.total_amount?.toLocaleString()}\nMonthly recurring: ₦${res.data.monthly_recurring?.toLocaleString()}`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('DidPurchaseSuccess', {
                  paymentMethod: 'wallet',
                  amount: res.data.total_amount,
                  monthlyRecurring: res.data.monthly_recurring,
                  didCount: res.data.did_count,
                  dids: selectedDids,
                });
              }
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
    }
  };

  const handlePaystackPayment = async (payload) => {
    try {
      const res = await api.post('/billings/dids/purchase/', payload);

      if (res.data?.success) {
        const { authorization_url, reference, total_amount, monthly_recurring, did_count } = res.data;
        navigation.navigate('PaystackCheckout', { 
          url: authorization_url, 
          reference,
          totalAmount: total_amount,
          monthlyRecurring: monthly_recurring,
          didCount: did_count,
          isDidPurchase: true,
          selectedDids: selectedDids,
        });
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleProceed = () => {
    if (selectedDids.length === 0) {
      Alert.alert('Error', 'Please select at least one hotline');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePay = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      setShowPaymentModal(false);

      const payload = {
        dids: selectedDids.map(did => ({ id: did.id })),
        payment_method: selectedPaymentMethod,
      };

      console.log('Initiating DID purchase:', payload);

      if (selectedPaymentMethod === 'wallet') {
        await handleWalletPayment(payload);
      } else if (selectedPaymentMethod === 'paystack') {
        await handlePaystackPayment(payload);
      }
    } catch (error) {
      console.error('Failed to initiate DID purchase:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

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
        <Text style={styles.headerTitle}>Get a hotline now</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* DIDs Grid */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selection Summary */}
        {selectedDids.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryText}>
              {selectedDids.length} hotline{selectedDids.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.summaryAmount}>
              ₦{totalAmount.toLocaleString()}/month
            </Text>
          </View>
        )}

        {dids.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hotlines available at the moment.</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {dids.map((did, index) => {
              const colorScheme = cardColors[index % cardColors.length];
              const isSelected = selectedDids.some(d => d.id === did.id);

              return (
                <TouchableOpacity
                  key={did.id}
                  style={[
                    styles.hotlineCard,
                    isSelected && styles.hotlineCardSelected
                  ]}
                  onPress={() => handleDidSelect(did)}
                  activeOpacity={0.8}
                >
                  {/* Header with icon and title */}
                  <View style={[styles.cardHeader, { backgroundColor: colorScheme.headerBg }]}>
                    <Image
                      source={imageMap[colorScheme.image]}
                      style={styles.phoneIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.hotlineTitle}>
                      Hotline {index + 1}
                    </Text>
                  </View>

                  {/* Phone number and selection indicator */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardBodyContent}>
                      <Text style={styles.phoneNumber}>{did.number}</Text>
                      <Text style={styles.priceText}>₦{PRICE_PER_DID.toLocaleString()}/mo</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Proceed Button */}
      <TouchableOpacity
        style={[
          styles.proceedButton,
          selectedDids.length === 0 && styles.proceedButtonDisabled
        ]}
        onPress={handleProceed}
        disabled={selectedDids.length === 0}
      >
        <Text style={styles.proceedText}>
          Proceed to Payment
          {selectedDids.length > 0 && ` (₦${totalAmount.toLocaleString()})`}
        </Text>
      </TouchableOpacity>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Payment Summary */}
            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Selected Hotlines:</Text>
                <Text style={styles.modalSummaryValue}>{selectedDids.length}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Price per hotline:</Text>
                <Text style={styles.modalSummaryValue}>₦{PRICE_PER_DID.toLocaleString()}</Text>
              </View>
              <View style={styles.modalSummaryDivider} />
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabelBold}>Monthly Total:</Text>
                <Text style={styles.modalSummaryValueBold}>₦{totalAmount.toLocaleString()}</Text>
              </View>
            </View>

            {/* Payment Methods */}
            <View style={styles.paymentMethodsContainer}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    method.disabled && styles.paymentMethodCardDisabled
                  ]}
                  onPress={() => handlePaymentMethodSelect(method)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodContent}>
                    <Text style={[
                      styles.paymentMethodLabel,
                      method.disabled && styles.paymentMethodLabelDisabled
                    ]}>
                      {method.label}
                    </Text>
                    {method.disabled && (
                      <Text style={styles.insufficientText}>Insufficient balance</Text>
                    )}
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedPaymentMethod === method.id && styles.radioButtonSelected,
                    method.disabled && styles.radioButtonDisabled
                  ]}>
                    {selectedPaymentMethod === method.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[
                styles.modalPayButton,
                !selectedPaymentMethod && styles.modalPayButtonDisabled
              ]}
              onPress={handlePay}
              disabled={!selectedPaymentMethod}
            >
              <Text style={styles.modalPayButtonText}>
                Pay ₦{totalAmount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  backButtonIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 34,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  selectionSummary: {
    backgroundColor: '#E7F7E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  hotlineCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  hotlineCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  cardHeader: {
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },

  phoneIcon: {
    width: 250,
    height: 100,
    bottom: -30,
    left: 0,
    tintColor: '#FFFFFF',
    position: 'absolute'
  },

  hotlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cardBody: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardBodyContent: {
    flex: 1,
  },

  phoneNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },

  priceText: {
    fontSize: 13,
    color: '#666',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  },

  proceedButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },

  proceedButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  proceedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  modalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },

  modalSummary: {
    backgroundColor: '#E7F7E1',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },

  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  modalSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },

  modalSummaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  modalSummaryDivider: {
    height: 1,
    backgroundColor: '#D0D0D0',
    marginVertical: 8,
  },

  modalSummaryLabelBold: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },

  modalSummaryValueBold: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },

  paymentMethodsContainer: {
    paddingHorizontal: 20,
  },

  paymentMethodCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 15,
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

  modalPayButton: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  modalPayButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  modalPayButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HotlinesList;