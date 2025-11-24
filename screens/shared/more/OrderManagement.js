import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import Avatar from '../../../components/Avatar';

const OrderManagement = ({ navigation }) => {
  const menuItems = [
    {
      id: 'orders',
      title: 'Orders',
      icon: require('../../../assets/ic_orders.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'products',
      title: 'Products',
      icon: require('../../../assets/ic_products.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('Products'),
    },
    {
      id: 'sales',
      title: 'Sales Analytics',
      icon: require('../../../assets/ic_analytics.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('SalesAnalytics'),
    },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.backgroundColor }]}>
        <Avatar
          name={item.id}
          size={50}
          image={item?.icon}
          badge={null}
        />
      </View>

      <Text style={styles.menuText}>{item.title}</Text>

      <FontAwesome6
        name="chevron-right"
        size={16}
        color="#999"
        iconStyle='solid'
      />
    </TouchableOpacity>
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../../assets/backWhite.png')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map(renderMenuItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    // Simple back button without extra styling
  },
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
    width: 20, // Same width as back button icon for centering
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default OrderManagement;