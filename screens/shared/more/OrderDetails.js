import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { colors } from '../../../styles/global';

const OrderDetails = ({ navigation, route }) => {
  // Get order data from route params, with fallback to static data
  const order = route?.params?.order || {
    id: 'ORD-001',
    customer: 'John Adebayo',
    dateTime: '2024-11-13, 2:00PM',
    paymentMethod: 'Cash',
    status: 'confirmed',
    items: [
      { name: 'Wireless Headphones', price: 15000, quantity: 1 },
      { name: 'Premium Coffee Beans', price: 2500, quantity: 1 },
      { name: 'Notebook Set', price: 800, quantity: 1 },
    ],
    total: 18300,
    notes: 'Customer Requested Gift Wrapping For The Headphones.',
  };

  // Calculate total items from items array
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  // Use total from order or calculate from items
  const totalAmount = order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: '#2563EB', backgroundColor: '#EFF6FF', borderColor: '#2563EB' };
      case 'completed':
        return { color: '#22C55E', backgroundColor: '#DCFCE7', borderColor: '#22C55E' };
      case 'draft':
        return { color: '#6B7280', backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
      default:
        return { color: '#6B7280', backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString()}`;
  };

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const statusStyle = getStatusStyle(order.status);

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

        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>{order.id}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor }
            ]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {capitalizeFirst(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{order.customer}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>{order.dateTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Items</Text>
            <Text style={styles.infoValue}>{totalItems} items</Text>
          </View>
        </View>

        {/* Order Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.price)} x{item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Total Amount */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>

        {/* Order Notes */}
        {order.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Order Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {},
  backButtonIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemName: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
  },
  notesCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});

export default OrderDetails;