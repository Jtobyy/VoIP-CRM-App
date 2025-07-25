import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  Clipboard,
} from 'react-native';
import { colors } from '../../styles/global'; // Assuming you have global colors

const { width } = Dimensions.get('window');

const AccountManagement = ({ navigation }) => {
  const menuItems = [
    { 
      title: "My Nativetalk Number", 
      icon: "📱",
      onPress: () => navigation.navigate('NativetalkNumber')
    },
    { 
      title: "Buy a Plan", 
      icon: "🛒",
      onPress: () => navigation.navigate('BuyPlan')
    },
    { 
      title: "Edit Profile", 
      icon: "👤",
      onPress: () => navigation.navigate('EditProfile')
    },
    { 
      title: "Link a Social Media", 
      icon: "🔗",
      onPress: () => navigation.navigate('LinkSocialMedia')
    },
    { 
      title: "Users", 
      icon: "👥",
      onPress: () => navigation.navigate('Users')
    },
    { 
      title: "Manage Customers", 
      icon: "👥",
      onPress: () => navigation.navigate('ManageCustomers')
    },
    { 
      title: "Voice Recording", 
      icon: "🎤",
      onPress: () => navigation.navigate('VoiceRecording')
    },
    { 
      title: "Change Password", 
      icon: "🔒",
      onPress: () => navigation.navigate('ChangePassword')
    },
    { 
      title: "Help & Support", 
      icon: "❓",
      onPress: () => navigation.navigate('HelpSupport')
    },
  ];

  const handleCopyNumber = () => {
    Clipboard.setString('0803 567 0547');
    Alert.alert('Copied!', 'Phone number copied to clipboard');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => {
          // Add your logout logic here
          console.log('Logging out...');
        }},
      ]
    );
  };

  const handleAddFunds = () => {
    navigation.navigate('AddFunds');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Account</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                style={styles.profileImage}
              />
            </View>
            
            <Text style={styles.profileName}>Chioma and Sons</Text>
            
            <Text style={styles.phoneLabel}>MY NATIVETALK NUMBER</Text>
            
            <View style={styles.phoneContainer}>
              <Text style={styles.phoneNumber}>0803 567 0547</Text>
              <TouchableOpacity onPress={handleCopyNumber} style={styles.copyButton}>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Acct. Balance</Text>
            <Text style={styles.balanceAmount}>₦38,000.00</Text>
          </View>
          <TouchableOpacity style={styles.addFundsButton} onPress={handleAddFunds}>
            <Text style={styles.addFundsText}>Add funds</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
                <Text style={styles.menuIcon}>↩️</Text>
              </View>
              <Text style={styles.menuTitle}>Log out</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Extra padding for bottom navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconInactive]}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelInactive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconInactive]}>📋</Text>
          <Text style={[styles.navLabel, styles.navLabelInactive]}>Call logs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconInactive]}>👥</Text>
          <Text style={[styles.navLabel, styles.navLabelInactive]}>Customers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconActive]}>💬</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconInactive]}>👤</Text>
          <Text style={[styles.navLabel, styles.navLabelInactive]}>Account</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom indicator */}
      <View style={styles.bottomIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  editIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  phoneLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneNumber: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
  },
  copyButton: {
    padding: 4,
  },
  copyIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginTop: -24,
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  addFundsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFundsText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutIconContainer: {
    backgroundColor: '#FEE8E8',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  chevron: {
    fontSize: 20,
    color: '#cccccc',
  },
  bottomPadding: {
    height: 100,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconActive: {
    color: '#4CAF50',
  },
  navIconInactive: {
    color: '#999999',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#4CAF50',
  },
  navLabelInactive: {
    color: '#999999',
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
});

export default AccountManagement;