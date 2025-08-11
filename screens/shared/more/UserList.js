import React,{useState,useEffect} from 'react';
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
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';

const UsersList = ({ navigation }) => {
  const [users,setUsers] = useState([])
  const {api} = useApi()
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

    const fetchUsers = async () => {
      setLoading(true);
        try {
            const res = await api.get(`/users/`);
            setUsers(res.data?.results);
        } catch (error) {
           console.error('Failed to fetch users:', error);
            handleApiError(error);
        } finally{
          setLoading(false);
        }
    };

  useEffect(()=>{
    fetchUsers()
  },[])

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
        {users.length === 0? (
          <Text style={styles.emptyText}>You do not have any users.</Text>
        ):users?.map((user) => (
          <TouchableOpacity
             key={user.id}
             style={styles.userItem}
             onPress={() => navigation.navigate('UserDetails', { userId: user.id })}
            activeOpacity={0.7}
          >
            <Avatar
              name={`${user.first_name || ''} ${user.last_name || ''}`.trim()}
              image={user.image}
              size={50}
              style={{ marginRight: 12 }}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</Text>
              <Text style={styles.userPhone}>{user.phone_number || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.menuButton}>
              <FontAwesome6 name="ellipsis-vertical" iconStyle='solid' size={20} color="#666" />
            </TouchableOpacity>
          </TouchableOpacity>
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
  emptyText: {
  textAlign: 'center',
  marginTop: 20,
  color: '#888',
  fontSize: 16,
  fontStyle: 'italic',
}

});

export default UsersList;
