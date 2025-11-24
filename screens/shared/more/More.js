import React,{useState,useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import Avatar from '../../../components/Avatar';
import { useAuth } from '../../../hooks/useAuth';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import Clipboard from '@react-native-clipboard/clipboard';

const More = ({ navigation }) => {
  const { logout } = useAuth();
  const {company} = useAuth()
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState('0.00')
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditCurrency, setCreditCurrency] = useState('NGN');
  const [dids, setDids] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { api } = useApi();
  const { setLoading } = useLoading();

  // IMPORTANT: Replace this with your actual website URL
  const WEB_SUBSCRIPTION_URL = 'https://yourapp.com/subscription';

  useEffect(() => {
    fetchUserProfile();
    fetchWalletBalance();
    fetchCreditBalance();
    fetchDids();
  }, []);

  const getCurrencySymbol = (currencyCode) => {
    if (currencyCode === 'NGN') {
      return 'â‚¦';
    }
    return '$';
  };

  const fetchCreditBalance = async () => {
    try {
      const res = await api.get('/billings/pbx-credits/balance/');
      console.log('Credit balance response:', res);
      
      const b =
        res.data?.balance ??
        res.data?.credit_balance ??
        res.data?.credits?.balance ??
        0;
      
      const currency = res.data?.currency_code ?? 'NGN';
      
      setCreditBalance(Number(b) || 0);
      setCreditCurrency(currency);
    } catch (error) {
      console.error('Failed to fetch call credit balance:', error);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/me/`);
      const data = res.data.user;
      console.log('Fetched user data:',data)
      setUser(data);
      console.log('User profile fetched:',data)
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/billings/wallet/`);
      const data = res.data.wallet;
      setBalance(data?.balance);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDids = async () => {
    try {
      const res = await api.get(`/call-center/pbx/assigned-dids/`);
      setDids(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch DIDs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchWalletBalance(),
        fetchCreditBalance(),
        fetchDids()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // NEW: Handle subscription navigation based on platform
  const handleSubscriptionNavigation = () => {
    if (Platform.OS === 'ios') {
      // iOS: Open web browser for subscription management
      Alert.alert(
        'Manage Subscription',
        'You will be redirected to our website to manage your subscription.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              Linking.openURL(WEB_SUBSCRIPTION_URL).catch(err => {
                console.error('Failed to open URL:', err);
                Alert.alert('Error', 'Unable to open subscription page');
              });
            },
          },
        ]
      );
    } else {
      // Android: Use in-app navigation with Paystack
      navigation.navigate('SubscriptionAndPricing');
    }
  };

  const menuItems = [
    {
      id: 'order-management',
      title: 'Order Management',
      icon: require('../../../assets/ic_orders.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('OrderManagement'),
    },
    {
      id: 'link-social',
      title: 'Link Social Media',
      icon: require('../../../assets/ic_link.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('ConnectChannels'),
    },
    {
      id: 'users',
      title: 'Users',
      icon: require('../../../assets/ic_customers.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('Users'),
    },
    // {
    //   id: 'subscription',
    //   title: Platform.OS === 'ios' ? 'Manage Subscription' : 'Subscription and Pricing',
    //   icon: require('../../../assets/ic_subscription.png'),
    //   iconColor: '#22C55E',
    //   backgroundColor: '#DCFCE7',
    //   onPress: handleSubscriptionNavigation, // UPDATED: Platform-specific handler
    // },
    {
      id: 'help',
      title: 'Help & Support',
      icon: require('../../../assets/ic_help.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      id: 'manage',
      title: 'Manage Account',
      icon: require('../../../assets/ic_manage_account.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('ManageAccount'),
    },
    {
      id: 'logout',
      title: 'Log out',
      icon: require('../../../assets/ic_logout.png'),
      iconColor: '#EF4444',
      backgroundColor: '#FEE2E2',
      onPress: () => handleLogout(),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout(); 
            } catch (e) {
              console.error('Logout failed', e);
            }
          },
        },
      ]
    );
  };
  
  const handleCopyNumber = (phoneNumber) => {
    Clipboard.setString(phoneNumber || '');
    Alert.alert('Copied', 'Phone number copied to clipboard');
  };

  // UNCHANGED: Add funds is allowed on all platforms
  const handleAddFunds = () => {
    navigation.navigate('AddFunds');
  };

  // UNCHANGED: Buy credit is allowed on all platforms
  const handleBuyCredit = () => {
    navigation.navigate('BuyCallCredit');
  };

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
    <View 
      style={styles.container}
    >
      <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
      
      {/* Header */}
      <ImageBackground 
        source={require('../../../assets/more_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.headerInner}>
          <View style={[styles.headerContent]}>
            <View style={{ width: 24 }} />
          
            <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
              More
            </Text>
            
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
              <FontAwesome6 
                name="pen" 
                size={13} 
                color="white" 
                iconStyle='solid'
              />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {`${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.profileName}>{company?.name}</Text>
          
            <View style={styles.phoneContainer}>
              <Text style={styles.phoneLabel}>
                MY HOTLINE{dids.length > 1 ? 'S' : ''}
              </Text>

              {dids.length === 0 ? (
                <TouchableOpacity 
                  style={styles.phoneNumberContainer}
                  disabled
                >
                  <Text style={styles.phoneNumber}>N/A</Text>
                </TouchableOpacity>
              ) : dids.length === 1 ? (
                <TouchableOpacity 
                  style={styles.phoneNumberContainer}
                  onPress={() => handleCopyNumber(dids[0].number)}
                >
                  <Text style={styles.phoneNumber}>{dids[0].number}</Text>
                  <FontAwesome6 
                    name="copy" 
                    size={16} 
                    color="white" 
                    iconStyle='solid'
                    style={styles.copyIcon}
                  />
                </TouchableOpacity>
              ) : (
                <ScrollView 
                  style={styles.numbersScrollContainer}
                  contentContainerStyle={styles.numbersScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {dids.map((did, index) => (
                    <TouchableOpacity 
                      key={did.id || did.number || index}
                      style={[
                        styles.phoneNumberContainer,
                        styles.phoneNumberItem,
                        index < dids.length - 1 && styles.phoneNumberItemMargin
                      ]}
                      onPress={() => handleCopyNumber(did.number)}
                    >
                      <Text style={styles.phoneNumber}>{did.number}</Text>
                      <FontAwesome6 
                        name="copy" 
                        size={16} 
                        color="white" 
                        iconStyle='solid'
                        style={styles.copyIcon}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Balance Card - UNCHANGED (Allowed on all platforms) */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceContent}>
          <View>
            <Text style={styles.balanceLabel}>Acct. Balance</Text>
            <Text style={[typography.heading3, {fontWeight: 'bold'}]}>{`${balance}`}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addFundsButton}
            onPress={handleAddFunds}
          >
            <Text style={styles.addFundsText}>Add funds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Call Credit Balance Card - UNCHANGED (Allowed on all platforms) */}
      <View style={[styles.balanceCard, styles.creditCard, {'display': 'none'}]}>
        <View style={styles.balanceContent}>
          <View>
            <Text style={styles.balanceLabel}>Call Credit Balance</Text>
            <Text style={[typography.heading3, { fontWeight: 'bold' }]}>
              {`${getCurrencySymbol(creditCurrency)}${creditBalance.toLocaleString()}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={handleBuyCredit}
          >
            <Text style={styles.addFundsText}>Buy credit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView 
        style={styles.menuContainer}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {menuItems.map(renderMenuItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerInner: {
    paddingHorizontal: 20,
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 8,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  phoneContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  phoneLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  phoneNumber: {
    fontSize: 13,
    color: 'white',
    fontWeight: '500',
    marginRight: 8,
  },
  copyIcon: {
    marginLeft: 4,
  },
  numbersScrollContainer: {
    maxHeight: 90,
    width: '100%',
  },
  numbersScrollContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  phoneNumberItem: {
    alignSelf: 'center',
  },
  phoneNumberItemMargin: {
    marginBottom: 8,
  },
  balanceCard: {
    marginHorizontal: 17,
    marginTop: -32,
    backgroundColor: '#E7F7E1',
    borderRadius: 15,
    paddingVertical: 7,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1,
  },
  creditCard: {
    marginTop: 12,
    backgroundColor: '#EAF3FF',
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addFundsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    display: 'none'
  },
  addFundsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  menuContainer: {
    flex: 1,
    marginTop: 10,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  avatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E7F7E1',
  },
});

export default More;