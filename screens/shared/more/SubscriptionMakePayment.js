import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
} from 'react-native';
import { colors } from '../../../styles/global';

const MakePayment = ({ route, navigation }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Get plan details from navigation params
  const { 
    plan, 
    extensions = 2, 
    totalPrice = 0 
  } = route?.params || {};

  // Static phone number for now
  const selectedPhoneNumber = '+234 810 179 0957';

  // Determine if it's the free plan
  const isFree = plan?.id === 'free' || totalPrice === 0;

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

  const handlePay = () => {
    if (!selectedPaymentMethod && !isFree) {
      alert('Please select a payment method');
      return;
    }

    console.log('Processing payment:', {
      plan,
      extensions,
      totalPrice,
      paymentMethod: selectedPaymentMethod,
      phoneNumber: selectedPhoneNumber,
    });

    // Navigate to payment processing or success screen
    // navigation.navigate('PaymentSuccess');
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
        {/* Payment Summary Section */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone Number Selected</Text>
            <Text style={styles.summaryValue}>{selectedPhoneNumber}</Text>
          </View>

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
        style={styles.payButton}
        onPress={handlePay}
      >
        <Text style={styles.payButtonText}>
          {isFree ? 'Confirm' : 'Pay'}
        </Text>
      </TouchableOpacity>
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

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default MakePayment;