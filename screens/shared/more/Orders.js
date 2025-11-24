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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const Orders = ({ navigation }) => {
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);
  const [showStatusOptions, setShowStatusOptions] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  const orders = [
    {
      id: 'ORD-001',
      customer: 'John Adebayo',
      total: 22500,
      items: [
        { name: 'Wireless Headphones', price: 15000, quantity: 1 },
        { name: 'Premium Coffee Beans', price: 2500, quantity: 1 },
        { name: 'Notebook Set', price: 800, quantity: 1 },
      ],
      status: 'confirmed',
      dateTime: '2024-11-13, 2:00PM',
      paymentMethod: 'Cash',
      notes: 'Customer Requested Gift Wrapping For The Headphones.',
    },
    {
      id: 'ORD-002',
      customer: 'John Adebayo',
      total: 22500,
      items: [
        { name: 'Wireless Headphones', price: 15000, quantity: 1 },
        { name: 'Premium Coffee Beans', price: 5000, quantity: 2 },
        { name: 'Notebook Set', price: 2500, quantity: 1 },
      ],
      status: 'completed',
      dateTime: '2024-11-12, 10:30AM',
      paymentMethod: 'Bank Transfer',
      notes: '',
    },
    {
      id: 'ORD-003',
      customer: 'Sarah Okonkwo',
      total: 22500,
      items: [
        { name: 'Premium Coffee Beans', price: 2500, quantity: 3 },
        { name: 'Notebook Set', price: 800, quantity: 2 },
      ],
      status: 'draft',
      dateTime: '2024-11-13, 4:15PM',
      paymentMethod: 'Cash',
      notes: 'Pending confirmation from customer.',
    },
    {
      id: 'ORD-004',
      customer: 'Sarah Okonkwo',
      total: 22500,
      items: [
        { name: 'Wireless Headphones', price: 15000, quantity: 1 },
        { name: 'Notebook Set', price: 800, quantity: 1 },
      ],
      status: 'cancelled',
      dateTime: '2024-11-14, 9:00AM',
      paymentMethod: 'POS/Card',
      notes: 'Customer cancelled order',
    },
  ];

  const statusOptions = [
    { label: 'All orders', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const handleStatusSelect = (value) => {
    setSelectedStatus(value);
    setShowStatusOptions(false);
    setShowFilterMenu(false);
  };

  const toggleFilterMenu = () => {
    setShowFilterMenu(!showFilterMenu);
    setShowStatusOptions(false);
  };

  const handleStatusMenuPress = () => {
    setShowStatusOptions(!showStatusOptions);
  };

  const closeAllMenus = () => {
    setShowFilterMenu(false);
    setShowStatusOptions(false);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: '#16A34A', backgroundColor: '#DCFCE7', borderColor: '#16A34A' };
      case 'completed':
        return { color: '#22C55E', backgroundColor: 'transparent', borderColor: 'transparent' };
      case 'draft':
        return { color: '#6B7280', backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' };
      case 'cancelled':
        return { color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#DC2626' };
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

  const renderOrderCard = (order) => {
    const statusStyle = getStatusStyle(order.status);
    
    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { order })}
      >
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

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Customer</Text>
          <Text style={styles.orderValue}>{order.customer}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Total</Text>
          <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{order.items.length} Items</Text>
          <Text style={styles.viewDetails}>View details</Text>
        </View>
      </TouchableOpacity>
    );
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

        <Text style={styles.headerTitle}>Orders</Text>

        <TouchableOpacity style={styles.menuButton} onPress={toggleFilterMenu}>
          <FontAwesome6 name="ellipsis-vertical" size={18} color="#fff" iconStyle="solid" />
        </TouchableOpacity>
      </ImageBackground>

      {/* Filter Menu Modal */}
      <Modal
        visible={showFilterMenu}
        transparent
        animationType="fade"
        onRequestClose={closeAllMenus}
      >
        <TouchableWithoutFeedback onPress={closeAllMenus}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.filterMenu}>
                {/* Status Option */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={handleStatusMenuPress}
                >
                  <Text style={styles.filterMenuText}>Status</Text>
                  <FontAwesome6
                    name={showStatusOptions ? "chevron-down" : "chevron-right"}
                    size={16}
                    color="#000"
                    iconStyle="solid"
                  />
                </TouchableOpacity>

                {/* Status Options Dropdown */}
                {showStatusOptions && (
                  <View style={styles.statusOptionsContainer}>
                    {statusOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.statusOption}
                        onPress={() => handleStatusSelect(option.value)}
                      >
                        <Text style={[
                          styles.statusOptionText,
                          selectedStatus === option.value && styles.selectedStatusText
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Date Option */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    // Handle date filter - to be implemented
                    closeAllMenus();
                  }}
                >
                  <Text style={styles.filterMenuText}>Date</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Orders List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No orders found</Text>
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>Tap </Text>
          <FontAwesome6 name="plus" size={12} color="#666" iconStyle="solid" />
          <Text style={styles.tooltipText}> to create order</Text>
        </View>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateOrder')}
        >
          <FontAwesome6 name="plus" size={24} color="#fff" iconStyle="solid" />
        </TouchableOpacity>
      </View>
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
  menuButton: {
    width: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110,
    paddingRight: 20,
  },
  filterMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  filterMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterMenuText: {
    fontSize: 16,
    color: '#000',
  },
  statusOptionsContainer: {
    paddingLeft: 20,
  },
  statusOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedStatusText: {
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderCard: {
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
    marginBottom: 12,
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
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  orderValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  viewDetails: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 100,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default Orders;