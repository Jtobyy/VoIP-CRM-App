import React, { useState,useEffect,useMemo } from 'react';
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
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import {formatChatTime} from '../../../utils/timeUtils'

const pad2 = n => (n < 10 ? `0${n}` : `${n}`);
const toYMD = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

const buildRecent7d = () => {
  const end = new Date(); 
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return { start_date: toYMD(start), end_date: toYMD(end) };
};


// Safely pull an image url or return undefined
const pickAvatarFromContact = (c) => c?.profileImage || undefined;
const pickChannelIconFromContact = (c) => c?.channel?.image || undefined;

const tidyPreview = (text) => {
  if (!text) return '—';
  return String(text).replace(/\s+/g, ' ').trim();
};


const transformContactToActivity = (c) => {
  const name = c?.name || c?.unique_identifier || 'Unknown';
  const description = tidyPreview(c?.lastMessage || c?.lastMessageData?.content);
  const time = formatChatTime(c?.lastMessageTime);
  const unread = c?.unreadCount ?? 0;

  return {
    // UI fields
    id: c.id,                        // <-- contact id (lead/customer abstraction)
    type: 'message',                 // contacts = messages for now
    avatar: pickAvatarFromContact(c),
    initials: null,
    name,
    description,
    time,
    status: (c?.channel?.name || '').toLowerCase(),  // e.g., 'email', 'whatsapp'
    platform: (c?.channel?.name || '').toLowerCase(),
    backgroundColor: null,
    textColor: null,
    unread,

    // extra navigation fields
    conversation_id: c?.lastMessageData?.conversation ?? null,
    lead_id: c?.id ?? null,          // keep for compatibility if needed
    customer_id: null,               // contacts API seems lead-like; set null for now
    profile_pic: pickAvatarFromContact(c),
    channel_icon: pickChannelIconFromContact(c),
    rawTimestamp: c?.lastMessageTime,
    channel: c?.channel ? { image: pickChannelIconFromContact(c) } : null,
    lastMessageText: c?.lastMessageData?.content || c?.lastMessage || '',
  };
};

const RecentActivities = ({ navigation }) => {
    const {api} = useApi()
    const { loading,setLoading } = useLoading();
    const { handleApiError } = useError();
    const [activities, setActivities] = useState([]);
    const { start_date, end_date } = useMemo(buildRecent7d, []);

    useEffect(() => {
    let cancelled = false;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/communication/contacts/', {
          params: {
            page_size:10,
            call_logs: true, // backend will start honoring this later
          },
        });

        const results = Array.isArray(res?.data?.results) ? res.data.results : [];
        const mapped = results.map(transformContactToActivity);
        if (!cancelled) setActivities(mapped);
      } catch (err) {
        console.warn('Failed to load conversations', err?.message || err);
        handleApiError(err);
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConversations();
    return () => { cancelled = true; };
  }, []);
  
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
        return require('../../../assets/missed.png');
      case 'outgoing':
        return require('../../../assets/outgoing.png');
      default:
        return require('../../../assets/incoming.png');
    }
  };

  const renderAvatar = (activity) => {
    if (activity.avatar) {
      return (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: activity.avatar }} style={styles.avatar} />
          {activity.platform ? (
            <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(activity.platform) }]}>
              <Text style={styles.platformIcon}>{getPlatformIcon(activity.platform)}</Text>
            </View>
          ) : null}
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
      const contactId = activity.id; // contact endpoint gives you the contact id directly

  navigation.navigate('ConversationScreen', {
    contactId,
    contact: {
      id: contactId,
      name: activity.name,
      image: activity.profile_pic,
      channel: activity.channel, // { image: url }
      lastMessageData: { content: activity.lastMessageText },
      last_message_at: activity.rawTimestamp,
    },
    conversationId: activity.conversation_id,
  });
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
            source={require('../../../assets/header_bg.png')}
            style={styles.header}
            resizeMode="cover"
          >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Image
              source={require('../../../assets/backWhite.png')} 
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Recent Activities</Text>
          <View style={styles.headerRight} />
      </ImageBackground>

      {/* Activities List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                  {activity.type === 'call' ? (
                    getCallIcon(activity.status)
                  ) : null}
                  <Text style={[
                    styles.activityDescriptionText,
                    activity.status === 'missed' && styles.missedCallText
                  ]}
                   numberOfLines={1}
                  ellipsizeMode="tail"
                  >
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
                      source={require('../../../assets/info.png')} 
                      style={styles.infoIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                // Message: Time + Unread (vertical)
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  {activity.unread ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{activity.unread}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
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
    scrollContent: {
    paddingBottom: 50, // ✅ pushes content above the bottom edge
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