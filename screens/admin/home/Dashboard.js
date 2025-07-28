import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image } from 'react-native';
import { colors, typography } from '../../../styles/global';
import Avatar from '../../../components/Avatar';
import { useNavigation } from '@react-navigation/native';


const AdminDashboard = ({ navigation }) => {
  const activeCustomers = ['CL', 'AL', 'O', 'AL', 'AS'];
  const recentActivities = [
    { 
      id: '1',
      name: '+234 905 332 4369',
      type: 'call',
      text: 'Missed call',
      time: '10:33 PM',
    },
    { 
      id: '2',
      name: 'Shima Alidae',
      type: 'call',
      text: 'Outgoing call',
      time: '4:33 PM',
    },
    { 
      id: '3',
      name: 'Chioma Okere',
      type: 'message',
      channel: 'instagram',
      channel_icon: require('../../../assets/instagram.png'),
      text: 'Hi Chichi! I\'d love to hear more about what...',
      time: 'Yesterday',
      profile_pic: require('../../../assets/sample1.png')
    },
    { 
      id: '4',
      name: 'Sade Adu',
      type: 'message',
      channel: 'telegram',
      channel_icon: require('../../../assets/telegram.png'),
      text: 'Hi Chichi! I\'d love to hear more about what...',
      time: 'Yesterday',
      profile_pic: require('../../../assets/sample2.png')
    },
    { 
      id: '5',
      name: 'Viv Ubochi',
      type: 'call',
      channel: 'facebook',
      channel_icon: require('../../../assets/facebook.png'),
      text: 'I\'m Vivian! My first investi...',
      time: 'Yesterday',
      profile_pic: require('../../../assets/sample3.png')
    }
  ];

  const handleSeeAllPress = () => {
    navigation.navigate('RecentActivities');
  };  

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, Chioma and Sons 😊</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={[styles.statCard, {backgroundColor: '#E0EDFF'}]}>
            <Text style={styles.statTitle}>TOTAL NUMBER OF CALLS</Text>
            <Text style={styles.statValue}>25</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, {backgroundColor: '#EAF8E5'}]}>
            <Text style={styles.statTitle}>TOTAL NUMBER OF MESSAGES</Text>
            <Text style={styles.statValue}>25</Text>
          </View>

          <View style={[styles.statCard, {backgroundColor: '#F2F2F2'}]}>
            <Text style={styles.statTitle}>MOST ACTIVE CHANNELS</Text>
            <View style={styles.activeCustomers}>
              {activeCustomers.map((customer, index) => (
                <Avatar 
                  key={index} 
                  name={customer} 
                  size={32} 
                  style={{ marginRight: -5, marginBottom: 8 }}
                />
              ))}
            </View>
          </View>

          <View style={[styles.statCard, {backgroundColor: 'white', borderColor: '#DFE1E6', borderWidth: 1}]}>
            <Text style={styles.statTitle}>NEW</Text>
            <Text style={styles.statTitle}>CUSTOMERS</Text>
            <View style={styles.activeCustomers}>
              {activeCustomers.map((customer, index) => (
                <Avatar 
                  key={index} 
                  name={customer} 
                  size={32} 
                  style={{ marginRight: -5, marginBottom: 8 }}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Most Active Customers */}
        <View style={[styles.section, {backgroundColor: '#FAFAFA', borderColor: '#DFE1E6', borderWidth: 1, padding: 15}]}>
          <View>
            <Text style={styles.statTitle}>RETURNING</Text>
            <Text style={styles.statTitle}>CUSTOMERS</Text>
          </View>
          <View style={styles.activeCustomers}>
            {activeCustomers.map((customer, index) => (
              <Avatar 
                key={index} 
                name={customer} 
                size={35} 
                style={{ marginRight: -5, marginBottom: 8 }}
              />
            ))}
          </View>
        </View>

        {/* Add User Button */}
        <View style={styles.usersCard}>
          <TouchableOpacity onPress={() => navigation.navigate('Users')} style={{width: '40%'}}>
            <Text style={styles.statTitle}>TOTAL NUMBER OF USERS</Text>
            <Text style={styles.statValue}>25</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addUserButton} onPress={() => navigation.navigate('AddUser')}>
            <Text style={styles.addUserText}>Invite users</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.heading2}>Recent Activities</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={handleSeeAllPress}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentActivities}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.activityItem}>
                <Avatar 
                  name={item.name} 
                  size={50} 
                  style={{ marginRight: 10 }}
                  image={item?.profile_pic}
                  badge={item?.channel_icon}
                />

                <View style={styles.activityContent}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.activityName}>{item.name}</Text>
                    {item.type == 'call' &&
                      <View style={{flexDirection: 'row', gap: 8}}>
                        <Text style={styles.activityTime}>{item.time}</Text>
                        <Image
                          source={require('../../../assets/info.png')} 
                          style={styles.infoIcon}
                          resizeMode="contain"
                        />
                      </View>
                    }
                  </View>

                  <View style={{flexDirection: 'row', gap: 8}}>
                    {item.type == 'call' && item.text == 'Missed call' && 
                      <Image
                          source={require('../../../assets/missed.png')} 
                          style={styles.infoIcon}
                          resizeMode="contain"
                      />
                    }
                    {item.type == 'call' && item.text == 'Outgoing call' && 
                      <Image
                          source={require('../../../assets/outgoing.png')} 
                          style={styles.infoIcon}
                          resizeMode="contain"
                      />
                    }
                    
                    <Text style={styles.activityType}>{item.text}</Text>
                  </View>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 80,
    backgroundColor: '#F7F7F7',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  usersCard: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    padding: 15,
    marginBottom: 30,
    backgroundColor: '#E0EDFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTitle: {
    fontSize: typography.body2.fontSize,
    color: 'black',
    marginBottom: 2,
    fontWeight: '400',
  },
  infoIcon: {
    width: 18,
    height: 18
  },
  statValue: {
    fontSize: typography.heading1.fontSize,
    fontWeight: 'bold',
    color: '#333333',
  },
  section: {
    marginBottom: 20,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  seeAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeCustomers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  addUserButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '40%',
  },
  addUserText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: '#666666',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  activityIcon: {
    fontSize: 16,
  },
});

export default AdminDashboard;