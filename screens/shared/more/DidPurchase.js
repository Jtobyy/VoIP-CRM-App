import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { colors } from '../../../styles/global';
import { CommonActions } from '@react-navigation/native';

const DidPurchaseSuccess = ({ route, navigation }) => {
  const {
    reference,
    amount,
    monthlyRecurring,
    didCount,
    paymentMethod,
    dids = [],
  } = route.params || {};

  const handleDone = () => {
    // Reset navigation to Main screen and navigate to More tab
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
    navigation.navigate('Main', { screen: 'More' });
  };

  const handleViewHotlines = () => {
    // Navigate to a screen where user can view their purchased hotlines
    // Adjust this navigation based on your app structure
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
    // Navigate to the appropriate screen - adjust as needed
    navigation.navigate('Main', { screen: 'CallCenter' });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheckmark}>✓</Text>
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your hotline{didCount > 1 ? 's have' : ' has'} been purchased successfully
        </Text>

        {/* Payment Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>
              {paymentMethod === 'wallet' ? 'Wallet' : 'Card Payment'}
            </Text>
          </View>

          {reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={[styles.detailValue, styles.referenceText]}>
                {reference}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hotlines Purchased</Text>
            <Text style={styles.detailValue}>{didCount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>Amount Paid</Text>
            <Text style={styles.detailValueBold}>
              ₦{amount?.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Monthly Recurring</Text>
            <Text style={styles.detailValueHighlight}>
              ₦{monthlyRecurring?.toLocaleString()}/month
            </Text>
          </View>
        </View>

        {/* Purchased Hotlines */}
        {dids.length > 0 && (
          <View style={styles.hotlinesCard}>
            <Text style={styles.hotlinesTitle}>Your New Hotlines</Text>
            {dids.map((did, index) => (
              <View key={did.id} style={styles.hotlineItem}>
                <View style={styles.hotlineNumberBadge}>
                  <Text style={styles.hotlineNumberBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.hotlineNumber}>{did.number}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Your hotlines are now active and ready to use. You will be charged ₦{monthlyRecurring?.toLocaleString()} monthly for these hotlines.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewHotlines}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>View My Hotlines</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  successIconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },

  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  successCheckmark: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },

  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  referenceText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },

  detailLabelBold: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },

  detailValueBold: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },

  detailValueHighlight: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },

  hotlinesCard: {
    backgroundColor: '#E7F7E1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  hotlinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  hotlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  hotlineNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  hotlineNumberBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  hotlineNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  infoText: {
    fontSize: 14,
    color: '#1976D2',
    flex: 1,
    lineHeight: 20,
  },

  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 12,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default DidPurchaseSuccess;