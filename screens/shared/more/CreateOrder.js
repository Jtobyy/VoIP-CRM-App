import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const CreateOrder = ({ navigation }) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [notes, setNotes] = useState('');

  // Static data
  const customers = [
    { id: 1, name: 'Johnson Adeniyi' },
    { id: 2, name: 'John Adebayo' },
  ];

  const products = [
    { id: 1, name: 'Premium Coffee Beans', price: 2500, stock: 45, items: 3 },
    { id: 2, name: 'Wireless Headphones', price: 15000, stock: 12, items: 2 },
  ];

  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Premium Coffee Beans', price: 2500, quantity: 2 },
    { id: 2, name: 'Premium Coffee Beans', price: 2500, quantity: 2 },
  ]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatCurrency = (amount) => `₦${amount.toLocaleString()}`;

  const updateQuantity = (id, delta) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: 'money-bill' },
    { id: 'bank', label: 'Bank Transfer', icon: 'building-columns' },
    { id: 'pos', label: 'POS/Card', icon: 'credit-card' },
    { id: 'other', label: 'Other', icon: 'ellipsis' },
  ];

  const renderCustomerCard = (customer) => (
    <View key={customer.id} style={styles.customerCard}>
      <Text style={styles.customerName}>{customer.name}</Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Customer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProductCard = (product) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
        <Text style={styles.productStock}>Stock: {product.stock}</Text>
        <Text style={styles.productItems}>{product.items} Items</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Product</Text>
      </TouchableOpacity>
    </View>
  );

  // Order Summary Modal
  const OrderSummaryModal = () => (
    <Modal visible={showOrderSummary} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{cartItems.length} Items</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowOrderSummary(false)}>
              <FontAwesome6 name="xmark" size={20} color="#333" iconStyle="solid" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalDivider} />

          <ScrollView style={styles.cartList}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemHeader}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <FontAwesome6 name="trash-can" size={18} color="#9CA3AF" iconStyle="solid" />
                  </TouchableOpacity>
                </View>
                <View style={styles.cartItemFooter}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => updateQuantity(item.id, -1)}
                    >
                      <FontAwesome6 name="minus" size={12} color="#fff" iconStyle="solid" />
                    </TouchableOpacity>
                    <View style={styles.quantityDisplay}>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.quantityBtn, styles.quantityBtnPlus]}
                      onPress={() => updateQuantity(item.id, 1)}
                    >
                      <FontAwesome6 name="plus" size={12} color="#fff" iconStyle="solid" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalDivider} />

          <TextInput
            style={styles.notesInput}
            placeholder="Add notes (optional)"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(cartTotal)}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { setShowOrderSummary(false); setShowPayment(true); }}
          >
            <Text style={styles.primaryButtonText}>Proceed to payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Record Payment Modal
  const RecordPaymentModal = () => (
    <Modal visible={showPayment} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={() => setShowPayment(false)}>
              <FontAwesome6 name="xmark" size={20} color="#333" iconStyle="solid" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalDivider} />

          <View style={styles.paymentTotalCard}>
            <Text style={styles.paymentTotalLabel}>Total</Text>
            <Text style={styles.paymentTotalAmount}>{formatCurrency(cartTotal)}</Text>
          </View>

          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          <View style={styles.paymentGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selectedPayment === method.id && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <FontAwesome6 name={method.icon} size={24} color="#1F2937" iconStyle="solid" />
                <Text style={styles.paymentOptionText}>{method.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { setShowPayment(false); setShowSuccess(true); }}
          >
            <Text style={styles.primaryButtonText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Payment Success Modal
  const PaymentSuccessModal = () => (
    <Modal visible={showSuccess} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <TouchableOpacity
            style={styles.closeButtonTop}
            onPress={() => { setShowSuccess(false); navigation.goBack(); }}
          >
            <FontAwesome6 name="xmark" size={20} color="#333" iconStyle="solid" />
          </TouchableOpacity>

          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <FontAwesome6 name="check" size={50} color="#fff" iconStyle="solid" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Order has been confirmed and recorded</Text>

            <View style={styles.successTotalCard}>
              <Text style={styles.successTotalLabel}>Total</Text>
              <Text style={styles.successTotalAmount}>{formatCurrency(cartTotal)}</Text>
              <Text style={styles.successPaymentMethod}>
                Payment Method: {paymentMethods.find(m => m.id === selectedPayment)?.label}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome6 name="print" size={20} color="#1F2937" iconStyle="solid" />
                <Text style={styles.actionButtonText}>Download{'\n'}Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome6 name="whatsapp" size={20} color="#1F2937" iconStyle="brands" />
                <Text style={styles.actionButtonText}>Send via{'\n'}WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome6 name="share-nodes" size={20} color="#1F2937" iconStyle="solid" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { setShowSuccess(false); setCartItems([]); }}
          >
            <Text style={styles.primaryButtonText}>Create New Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Header */}
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../../assets/backWhite.png')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order / POS</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setShowOrderSummary(true)}>
          <FontAwesome6 name="cart-shopping" size={20} color="#fff" iconStyle="solid" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Name</Text>
          <View style={styles.searchInput}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" iconStyle="solid" />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Enter Customer Name"
              placeholderTextColor="#9CA3AF"
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
          </View>
          {customers.map(renderCustomerCard)}
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Products</Text>
          <View style={styles.searchInput}>
            <FontAwesome6 name="magnifying-glass" size={16} color="#9CA3AF" iconStyle="solid" />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search Products"
              placeholderTextColor="#9CA3AF"
              value={productSearch}
              onChangeText={setProductSearch}
            />
          </View>
          {products.map(renderProductCard)}
        </View>

        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Create Order</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <OrderSummaryModal />
      <RecordPaymentModal />
      <PaymentSuccessModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingTop: 80, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButtonIcon: { width: 20, height: 20 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff', flex: 1, textAlign: 'center' },
  cartButton: { position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -8, right: -8, backgroundColor: '#EF4444',
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  searchInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12,
  },
  searchTextInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1F2937' },
  customerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  customerName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  addButton: { backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  productCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  productStock: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  productItems: { fontSize: 13, color: '#9CA3AF' },
  bottomPadding: { height: 40 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  itemCountBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginLeft: 10, borderWidth: 1, borderColor: '#2563EB' },
  itemCountText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },
  modalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  cartList: { maxHeight: 250 },
  cartItem: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 12 },
  cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityControl: { flexDirection: 'row', alignItems: 'center' },
  quantityBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  quantityBtnPlus: { backgroundColor: '#22C55E' },
  quantityDisplay: { backgroundColor: '#E5E7EB', paddingHorizontal: 24, paddingVertical: 6, borderRadius: 6, marginHorizontal: 8 },
  quantityText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  cartItemPrice: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  notesInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 14, color: '#1F2937', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  totalAmount: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  primaryButton: { backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: '#16A34A' },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // Payment Modal
  paymentTotalCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  paymentTotalLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  paymentTotalAmount: { fontSize: 28, fontWeight: '700', color: '#1F2937' },
  paymentMethodTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  paymentOption: { width: '48%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  paymentOptionSelected: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  paymentOptionText: { fontSize: 14, color: '#1F2937', fontWeight: '500', marginTop: 10 },

  // Success Modal
  closeButtonTop: { alignSelf: 'flex-end' },
  successContent: { alignItems: 'center', paddingVertical: 20 },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  successTotalCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%', marginBottom: 24 },
  successTotalLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  successTotalAmount: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  successPaymentMethod: { fontSize: 14, color: '#6B7280' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  actionButton: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  actionButtonText: { fontSize: 12, color: '#1F2937', fontWeight: '500', marginTop: 8, textAlign: 'center' },
  completeButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateOrder;