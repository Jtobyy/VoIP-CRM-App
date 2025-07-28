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
  Alert,
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import Avatar from '../../../components/Avatar';

const More = ({ navigation }) => {
  const userProfile = {
    name: 'Chioma and Sons',
    phone: '0803 567 0547',
    balance: '₦38,000.00',
    profileImage: require('../../../assets/sample1.png'), // Add your profile image
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: require('../../../assets/ic_moreprofile.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('EditProfile'),
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
      id: 'manage-customers',
      title: 'Manage Customers',
      icon: require('../../../assets/ic_customers.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('Customers'),
    },
    {
      id: 'native-number',
      title: 'My Nativetalk Number',
      icon: require('../../../assets/ic_manage.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('NativetalkNumber'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: require('../../../assets/ic_lock.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: require('../../../assets/ic_help.png'),
      iconColor: '#22C55E',
      backgroundColor: '#DCFCE7',
      onPress: () => navigation.navigate('HelpSupport'),
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
          onPress: () => {
            // Handle logout logic here
            // navigation.navigate('Login');
            console.log('Logging out...');
          },
        },
      ]
    );
  };

  const handleCopyNumber = () => {
    // Handle copy to clipboard functionality
    Alert.alert('Copied', 'Phone number copied to clipboard');
  };

  const handleAddFunds = () => {
    navigation.navigate('AddFunds');
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
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
      
      {/* Header */}
      <ImageBackground 
        source={require('../../../assets/more_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <View style={styles.headerInner}>
            <View style={[styles.headerContent]}>
              <View style={{ width: 24 }} /> {/* Empty view for balance */}
            
              <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
                More
              </Text>
              
              <TouchableOpacity style={styles.editButton}>
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
              <Image 
                source={userProfile.profileImage} 
                style={styles.profileImage}
                resizeMode="cover"
              />
            </View>
            
            <Text style={styles.profileName}>{userProfile.name}</Text>
            
            <View style={styles.phoneContainer}>
              <Text style={styles.phoneLabel}>MY NATIVETALK NUMBER</Text>
              <TouchableOpacity 
                style={styles.phoneNumberContainer}
                onPress={handleCopyNumber}
              >
                <Text style={styles.phoneNumber}>{userProfile.phone}</Text>
                <FontAwesome6 
                  name="copy" 
                  size={16} 
                  color="white" 
                  iconStyle='solid'
                  style={styles.copyIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceContent}>
          <View>
            <Text style={styles.balanceLabel}>Acct. Balance</Text>
            <Text style={[typography.heading2, {fontWeight: 'bold'}]}>{userProfile.balance}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addFundsButton}
            onPress={handleAddFunds}
          >
            <Text style={styles.addFundsText}>Add funds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView 
        style={styles.menuContainer}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
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
  header: {
    width: '100%',
    paddingTop: 50,
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
    marginBottom: 8,
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
    marginBottom: 13,
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
    marginBottom: 13,
  },
  phoneContainer: {
    alignItems: 'center',
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
  balanceCard: {
    marginHorizontal: 17,
    marginTop: -32,
    backgroundColor: '#E7F7E1',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1,
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
  },
  addFundsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    marginTop: 20,
  },
  menuContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom nav
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
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

export default More;