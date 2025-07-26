import React, { act } from 'react';
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
import { colors } from '../../styles/global'; // Assuming you have global colors
import Avatar from '../../components/Avatar';

const RecentActivities = ({ navigation }) => {
  const activities = [
    {
      id: 1,
      type: 'call',
      avatar: null,
      initials: '0',
      name: '+234 905 332 4369',
      description: 'Missed call',
      time: '10:33 PM',
      status: 'missed',
      backgroundColor: '#E8F5E8',
      textColor: '#4CAF50',
    },
    {
      id: 2,
      type: 'call',
      avatar: null,
      initials: 'AF',
      name: 'Adedoyin Folakemi',
      description: 'Outgoing call',
      time: '7:03 PM',
      status: 'outgoing',
      backgroundColor: '#E8F5E8',
      textColor: '#4CAF50',
    },
    {
      id: 3,
      type: 'call',
      avatar: null,
      initials: 'AL',
      name: 'Adrianna La Cerva (3)',
      description: 'Outgoing call',
      time: '4:33 PM',
      status: 'outgoing',
      backgroundColor: '#E3F2FD',
      textColor: '#2196F3',
    },
    {
      id: 4,
      type: 'call',
      avatar: null,
      initials: 'SA',
      name: 'Shima Alidae',
      description: 'Outgoing call',
      time: '4:33 PM',
      status: 'outgoing',
      backgroundColor: '#E3F2FD',
      textColor: '#2196F3',
    },
    {
      id: 5,
      type: 'message',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b812b1e2?w=100&h=100&fit=crop&crop=face',
      initials: null,
      name: 'Chioma Okere',
      description: "Hi Chichi! I'd love to hear more about what...",
      time: 'Yesterday',
      status: 'instagram',
      platform: 'instagram',
      backgroundColor: null,
      textColor: null,
    },
    {
      id: 6,
      type: 'message',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      initials: null,
      name: 'Sade Adu',
      description: "Hi Chichi! I'd love to hear more about what...",
      time: 'Yesterday',
      status: 'telegram',
      platform: 'telegram',
      backgroundColor: null,
      textColor: null,
    },
    {
      id: 7,
      type: 'message',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      initials: null,
      name: 'Viv Ubochi',
      description: "I'm Vivian! My first investment...",
      time: 'Yesterday',
      status: 'facebook',
      platform: 'facebook',
      backgroundColor: null,
      textColor: null,
      unread: 2,
    },
    {
      id: 8,
      type: 'message',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b812b1e2?w=100&h=100&fit=crop&crop=face',
      initials: null,
      name: 'Chioma Okere',
      description: "Hi Chichi! I'd love to hear more about what...",
      time: 'Yesterday',
      status: 'instagram',
      platform: 'instagram',
      backgroundColor: null,
      textColor: null,
    },
  ];

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram':
        return '📷';
      case 'telegram':
        return '✈️';
      case 'facebook':
        return '📘';
      default:
        return '';
    }
  };

  const getCallIcon = (status) => {
    switch (status) {
      case 'missed':
        return require('../../assets/missed.png');
      case 'outgoing':
        return require('../../assets/outgoing.png');
      default:
        return require('../../assets/incoming.png');
    }
  };

  const renderAvatar = (activity) => {
    if (activity.avatar) {
      return (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: activity.avatar }} style={styles.avatar} />
          {activity.platform && (
            <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(activity.platform) }]}>
              <Text style={styles.platformIcon}>{getPlatformIcon(activity.platform)}</Text>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View style={[styles.initialsContainer, { backgroundColor: activity.backgroundColor }]}>
          <Text style={[styles.initials, { color: activity.textColor }]}>
            {activity.initials}
          </Text>
        </View>
      );
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'instagram':
        return '#E1306C';
      case 'telegram':
        return '#0088CC';
      case 'facebook':
        return '#1877F2';
      default:
        return '#999999';
    }
  };

  const handleActivityPress = (activity) => {
    if (activity.type === 'call') {
      // Handle call item press
      console.log('Call pressed:', activity);
    } else {
      // Handle message item press
      console.log('Message pressed:', activity);
    }
  };

  const handleInfoPress = (activity) => {
    console.log('Info pressed:', activity);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      {/* Header */}
      <ImageBackground 
            source={require('../../assets/header_bg.png')}
            style={styles.header}
            resizeMode="cover"
          >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Image
              source={require('../../assets/backWhite.png')} 
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Recent Activities</Text>
          <View style={styles.headerRight} />
      </ImageBackground>

      {/* Activities List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityItem}
            onPress={() => handleActivityPress(activity)}
          >
            <View style={styles.activityLeft}>
              <Avatar 
                  name={activity.name}
                  size={50}
                  image={activity.profile_pic || activity.avatar}
                  badge={activity.type === 'message' ? activity.channel_icon : null}
              />

              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{activity.name}</Text>
                <View style={styles.activityDescription}>
                  {activity.type === 'call' && (
                    getCallIcon(activity.status)
                  )}
                  <Text style={[
                    styles.activityDescriptionText,
                    activity.status === 'missed' && styles.missedCallText
                  ]}>
                    {activity.description}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.activityRight}>
              {activity.type === 'call' ? (
                // Time + Info (horizontal)
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={() => handleInfoPress(activity)}
                  >
                    <Image
                      source={require('../../assets/info.png')} 
                      style={styles.infoIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                // Message: Time + Unread (vertical)
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  {activity.unread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{activity.unread}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    padding: 5,
  },
  backButtonIcon: {
    width: 20,
    height: 20
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 34, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
    paddingTop: 13,
    paddingBottom: 50
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  platformBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  platformIcon: {
    fontSize: 10,
  },
  initialsContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  initials: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  activityDescription: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#666666',
  },
  activityDescriptionText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  missedCallText: {
    color: '#F44336',
  },
  activityRight: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: 50,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 8
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoIcon: {
    width: 18,
    height: 18
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 4,
  },  
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RecentActivities;