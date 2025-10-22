import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { colors } from '../../../styles/global';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const MakePayment = ({ route, navigation }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [availableDids, setAvailableDids] = useState([]);
  const [selectedDid, setSelectedDid] = useState(null);
  const [showDidPicker, setShowDidPicker] = useState(false);

  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  // Get plan details from navigation params
  const { 
    plan, 
    extensions = 2, 
    totalPrice = 0 
  } = route?.params || {};

  // Determine if it's the free plan
  const isFree = plan?.rawPrice === 0 || totalPrice === 0;

  useEffect(() => {
    if (!isFree) {
      fetchAvailableDids();
    }
  }, [isFree]);

  const fetchAvailableDids = async () => {
    setLoading(true);
    try {
      const res = await api.get('/call-center/pbx/available-dids/');
      
      if (res.data?.success && res.data?.data) {
        setAvailableDids(res.data.data);
        // Auto-select first DID if available
        if (res.data.data.length > 0) {
          setSelectedDid(res.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch DIDs:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Payment methods
  const paymentMethods = [
    {
      id: 'wallet',
      label: `Pay via Wallet (₦${Number(totalPrice || 0).toLocaleString()})`,
      value: 'wallet',
    },
    {
      id: 'card',
      label: 'Pay via Debit/credit card',
      value: 'card',
    }
  ];

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method.id);
  };

  const handleDidSelect = (did) => {
    setSelectedDid(did);
    setShowDidPicker(false);
  };

  const handlePay = async () => {
    // Validate selections
    if (!isFree && !selectedDid) {
     alert('Please select a phone number');
     return;
    }

    if (!isFree && !selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      setLoading(true);

      // Prepare the payload
      const payload = {
       plan_id: parseInt(plan.id),
       // Only send selected_dids for paid plans
       ...(!isFree && selectedDid
         ? { selected_dids: [{ id: selectedDid.id, number: selectedDid.number }] }
         : {}),
       // Optional: if your backend needs extensions even for free plans
       ...(isFree ? { extensions } : {}),
     };

     console.log('Initiating subscription payment:', payload);

      // Call select-plan API
      const res = await api.post('/billings/subscriptions/select-plan/', payload);

      if (res.data?.success) {
        if (isFree) {
         // No payment step — confirm and leave
         // (swap this for your own success screen/snackbar)
         alert('Free plan activated successfully');
         navigation.goBack();
       } else {
         const { authorization_url, reference } = res.data;
         navigation.navigate('PaystackCheckout', { 
           url: authorization_url, 
           reference,
           subscriptionId: res.data.subscription_id,
           totalAmount: res.data.total_amount,
         });
       }
      }
    } catch (error) {
      console.error('Failed to initiate subscription payment:', error);
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
        <Text style={styles.headerTitle}>Make Payment</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DID Selection Section */}
        {!isFree && (
          <View style={styles.didSelectionSection}>
          <Text style={styles.sectionTitle}>Select Phone Number</Text>
          
          <TouchableOpacity
            style={styles.didPickerButton}
            onPress={() => setShowDidPicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.didPickerContent}>
              {selectedDid ? (
                <>
                  <Text style={styles.didPickerLabel}>Phone Number</Text>
                  <Text style={styles.didPickerValue}>{selectedDid.number}</Text>
                </>
              ) : (
                <Text style={styles.didPickerPlaceholder}>Select a phone number</Text>
              )}
            </View>
            <FontAwesome6 name="chevron-down" size={16} color="#666" iconStyle="solid" />
          </TouchableOpacity>
        </View>
        )}

        {/* Payment Summary Section */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{plan?.name}</Text>
          </View>

          {!isFree && (
            <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone Number Selected</Text>
            <Text style={styles.summaryValue}>
              {selectedDid ? selectedDid.number : 'Not selected'}
            </Text>
          </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>No Of Extensions</Text>
            <Text style={styles.summaryValue}>
              {isFree ? `${extensions} (Free)` : extensions}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Monthly Cost</Text>
            <Text style={styles.summaryValueBold}>
              ₦{totalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Method Section - Only show if not free */}
        {!isFree && (
          <View style={styles.paymentMethodSection}>
            <Text style={styles.paymentMethodTitle}>Payment method</Text>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.paymentMethodCard}
                onPress={() => handlePaymentMethodSelect(method)}
                activeOpacity={0.7}
              >
                <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                <View style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && styles.radioButtonSelected
                ]}>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <TouchableOpacity
        style={[
          styles.payButton,
          !selectedDid && styles.payButtonDisabled
        ]}
        onPress={handlePay}
        disabled={!selectedDid && !isFree}
      >
        <Text style={styles.payButtonText}>
          {isFree ? 'Confirm' : 'Pay'}
        </Text>
      </TouchableOpacity>

      {/* DID Picker Modal */}
      {!isFree && (
      <Modal
        visible={showDidPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDidPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Select Phone Number</Text>
                <TouchableOpacity onPress={() => setShowDidPicker(false)}>
                  <FontAwesome6 name="xmark" size={24} color="#333" iconStyle="solid" />
                </TouchableOpacity>
              </View>
            </View>

            {/* DID List */}
            <FlatList
              data={availableDids}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.didList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.didItem,
                    selectedDid?.id === item.id && styles.didItemSelected
                  ]}
                  onPress={() => handleDidSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.didItemContent}>
                    <Text style={styles.didItemNumber}>{item.number}</Text>
                    <Text style={styles.didItemId}>ID: {item.id}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedDid?.id === item.id && styles.radioButtonSelected
                  ]}>
                    {selectedDid?.id === item.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No phone numbers available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  didSelectionSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  didPickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  didPickerContent: {
    flex: 1,
  },

  didPickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  didPickerValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

  didPickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },

  summaryCard: {
    backgroundColor: '#E7F7E1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },

  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },

  summaryValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#D0D0D0',
    marginVertical: 12,
  },

  summaryLabelBold: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },

  summaryValueBold: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },

  paymentMethodSection: {
    marginBottom: 20,
  },

  paymentMethodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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

  paymentMethodLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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

  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  payButton: {
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

  payButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  payButtonText: {
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
    maxHeight: '70%',
  },

  modalHeader: {
    paddingTop: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  didList: {
    padding: 20,
  },

  didItem: {
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

  didItemSelected: {
    backgroundColor: '#E7F7E1',
    borderColor: colors.primary,
  },

  didItemContent: {
    flex: 1,
  },

  didItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  didItemId: {
    fontSize: 12,
    color: '#666',
  },

  emptyState: {
    padding: 40,
    alignItems: 'center',
  },

  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});

export default MakePayment;