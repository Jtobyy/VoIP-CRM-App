import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ImageBackground,
} from 'react-native';
import { colors } from '../../../styles/global';
import Avatar from '../../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const UsersList = ({ navigation }) => {
  const users = [
    {
      id: '1',
      name: 'Chioma Okere',
      phone: '08034562345',
      avatar: require('../../../assets/sample1.png'),
    },
    {
      id: '2',
      name: 'Chioma Okere',
      phone: '08034562345',
      avatar: require('../../../assets/sample2.png'),
    },
    {
      id: '3',
      name: 'Chioma Okere',
      phone: '08034562345',
      avatar: require('../../../assets/sample3.png'),
    },
    {
      id: '4',
      name: 'Chioma Okere',
      phone: '08034562345',
      avatar: require('../../../assets/sample1.png'),
    },
  ];

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
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* User List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {users.map((user) => (
          <View key={user.id} style={styles.userItem}>
            <Avatar
              name={user.name}
              image={user.avatar}
              size={50}
              style={{ marginRight: 12 }}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
            </View>
            <TouchableOpacity style={styles.menuButton}>
              <FontAwesome6 name="ellipsis-vertical" iconStyle='solid' size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Add User Button */}
      <TouchableOpacity
        style={styles.addUserButton}
        onPress={() => navigation.navigate('AddUser')}
      >
        <Text style={styles.addUserText}>Add New Users</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

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
    paddingTop: 8,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userPhone: {
    fontSize: 14,
    color: '#999',
  },
  menuButton: {
    padding: 8,
  },

  addUserButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addUserText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UsersList;
