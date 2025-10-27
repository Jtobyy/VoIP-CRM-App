import React,{useState,useEffect,useMemo, useCallback, useRef} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, 
  FlatList, ScrollView, Image,
  Modal, RefreshControl, 
  ImageBackground, AppState} from 'react-native';
import { colors, typography } from '../../../styles/global';
import Avatar from '../../../components/Avatar';
import { useNavigation } from '@react-navigation/native';
import {useAuth} from '../../../hooks/useAuth'
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import {formatChatTime} from '../../../utils/timeUtils'
import { useUnread } from '../../shared/notifications/UnreadProvider';
import { BellButton } from '../../../components/Bell';
import ActivityBreakdownChart from '../../../components/GroupedBarCharts';
import ChannelsDonutCard from '../../../components/ChannelsDonut';
import EnableNotificationsBanner from '../../../components/EnableNotificationsBanner';
import useCall from '../../../hooks/useCall';
import messaging from '@react-native-firebase/messaging';


const PREVIEW_LEN = 80;
const cleanPreview = (s = '') =>
  String(s)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[_`>#*-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PREVIEW_LEN) + (s && s.length > PREVIEW_LEN ? '…' : '');

// ---- date helpers ----
const pad2 = n => (n < 10 ? `0${n}` : `${n}`);
const toYMD = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

// returns { label, start_date, end_date }
const buildRange = (key) => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (key) {
    case '24h':
      start.setDate(start.getDate() - 1);
      return { label: 'Last 24 hrs', start_date: toYMD(start), end_date: toYMD(end) };
    case '48h':                              // NEW
      start.setDate(start.getDate() - 2);
      return { label: 'Last 48 hrs', start_date: toYMD(start), end_date: toYMD(end) };
    case '3d':                               // NEW
      start.setDate(start.getDate() - 3);
      return { label: 'Last 3 days', start_date: toYMD(start), end_date: toYMD(end) };
    case '7d':
      start.setDate(start.getDate() - 7);
      return { label: 'Last 7 days', start_date: toYMD(start), end_date: toYMD(end) };
    case '30d':
      start.setDate(start.getDate() - 30);
      return { label: 'Last 30 days', start_date: toYMD(start), end_date: toYMD(end) };
    default:
      start.setDate(start.getDate() - 1);
      return { label: 'Last 24 hrs', start_date: toYMD(start), end_date: toYMD(end) };
  }
};

const RANGE_OPTIONS = [
  { key: '24h', label: 'Last 24 hrs' },
  { key: '48h', label: 'Last 48 hrs' },
  { key: '3d',  label: 'Last 3 days' }, 
  { key: '7d',  label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

const pctArrow = (v) => (v > 0 ? '▲' : v < 0 ? '▼' : '•');
const pctNumber = (v) => `${Math.abs(v).toFixed(1)}%`;
const pctColor = (v) => (v > 0 ? '#16A34A' : v < 0 ? '#DC2626' : '#6B7280');

const AvatarGroup = ({ items = [], max = 5, size = 32, onOverflowPress }) => {
  const hasOverflow = items.length >= max;                   // show 4 + "+N" when len >= max
  const visible = hasOverflow ? items.slice(0, max - 1) : items;
  const extraCount = hasOverflow ? items.length - (max - 1) : 0;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
      {visible.map((it, i) => (
        <Avatar
          key={i}
          name={it?.name || it?.label || `#${i + 1}`}
          image={it?.icon}
          size={size}
          style={{ marginRight: -5, marginBottom: 8 }}
        />
      ))}

      {extraCount > 0 && (
        <TouchableOpacity
          onPress={onOverflowPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.plusBubble, { width: size, height: size, borderRadius: size / 2 }]}
          activeOpacity={0.8}
        >
          <Text style={styles.plusBubbleText}>{`+${extraCount}`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const extractPhoneNumber = (callLog) => {
  let phoneNumber = callLog.customer_name;

  const callerId = phoneNumber;
  
  // Remove quotes and backslashes
  let cleaned = callerId.replace(/["\\/]/g, '');
  
  // Try to extract number from "Name <number>" or "<number>" format
  const angleMatch = cleaned.match(/<([^>]+)>/);
  if (angleMatch) {
    phoneNumber = angleMatch[1];
  } else {
    // Just use the cleaned string
    phoneNumber = cleaned;
  }
  
  // remove any remaining special characters except + and digits
  phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  return phoneNumber;
};

const transformHourlyActivity = (hourlyActivity) => {
  if (!hourlyActivity || hourlyActivity.length === 0) {
    return {
      hours: [],
      calls: [],
      messages: [],
      maxY: 10
    };
  }

  // Extract and format the data
  const hours = hourlyActivity.map(item => {
    // Convert "13:00" to "1PM" format
    const hour = parseInt(item.hour.split(':')[0]);
    if (hour === 0) return '12AM';
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  });

  const calls = hourlyActivity.map(item => item.call_count);
  const messages = hourlyActivity.map(item => item.message_count);

  // Calculate appropriate maxY (round up to nearest 10, minimum 10)
  const maxValue = Math.max(...calls, ...messages);
  const maxY = maxValue === 0 ? 10 : Math.ceil(maxValue / 10) * 10;

  return { hours, calls, messages, maxY };
};

const getBusiestChannelInsight = (busiestChannel) => {
  if (!busiestChannel || !busiestChannel.total_messages) {
    return {
      message: 'No activity recorded today',
      hasIcon: false
    };
  }

  const { name, total_messages, icon } = busiestChannel;
  
  return {
    icon: icon,
    hasIcon: !!icon
  };
};

const normReg = (s) => String(s || '').toLowerCase(); // 'Ok' | 'ok' → 'ok'
const REG_COLORS = {
  ok:    { bg: '#E8FFF1', border: '#34C759', dot: '#34C759', text: '#0B3D23', label: 'Connected' },
  progress: { bg: '#FFF9E6', border: '#F59E0B', dot: '#F59E0B', text: '#5A3B00', label: 'Connecting…' },
  failed:   { bg: '#FFECEC', border: '#EF4444', dot: '#EF4444', text: '#6A0B0B', label: 'Failed' },
  cleared:  { bg: '#FFECEC', border: '#EF4444', dot: '#EF4444', text: '#6A0B0B', label: 'Signed out' },
  none:     { bg: '#F3F4F6', border: '#D1D5DB', dot: '#9CA3AF', text: '#374151', label: 'Not registered' },
  unknown:  { bg: '#F3F4F6', border: '#D1D5DB', dot: '#9CA3AF', text: '#374151', label: 'Not connected' },
};

const AgentDashboard = ({ navigation }) => {
  const { fetchCompanyDetails, company } = useAuth();
  const { canInviteUsers } = useAuth();
  const { register, dial, registrationStatus } = useCall();

  const goToCustomers = () => {
    navigation.navigate('Main', { screen: 'Customers' }); 
  };
 
  const [deltas, setDeltas] = useState({ calls_pct: 0, msgs_pct: 0 });

  const [rangeKey, setRangeKey] = useState('24h');
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);

  const {api} = useApi()
  const { loading,setLoading } = useLoading();
  const { handleApiError } = useError();
  const [stats, setStats] = useState({
    total_calls: 0, total_messages: 0, total_users: 0
  });
  const [activeChannels, setActiveChannels] = useState([]);     // array of {id,name,icon,...}
  const [newLeads, setNewLeads] = useState([]);                 // array of leads
  const [returningLeads, setReturningLeads] = useState([]);     // array of leads
  const [recentConversations, setRecentConversations] = useState([]);
  const [channelsStats, setChannelsStats] = useState([]);
  const [insight, setInsight] = useState();
  const [refreshing, setRefreshing] = useState(false);
  const [insightRemark, setInsightRemark] = useState();

  const [checkingReg, setCheckingReg] = useState(false);
  const [regState, setRegState] = useState(normReg(registrationStatus['_j']?.state))
  const color = REG_COLORS[regState] || REG_COLORS.unknown;

  const [regUser, setRegUser] = useState(registrationStatus['_j']?.username || '');
  const [regDomain, setRegDomain] = useState(registrationStatus['_j']?.domain || '');
  
  const regLine = regState === 'ok'
    ? (regUser && regDomain ? `${regUser}@${regDomain}` : color.label)
    : (color.label);
  
  const onPressRegistration = async () => {
    try {
      setCheckingReg(true);

      await register();
    } catch (e) {
      // no-op; pill will still show current status
    } finally {
      setCheckingReg(false);
    }
  };

  useEffect(() => {
    setRegState(normReg(registrationStatus['_j']?.state))
    setRegUser(registrationStatus['_j']?.username || '')
    setRegDomain(registrationStatus['_j']?.domain || '')
    console.log('registration status is ', registrationStatus)
  }, [registrationStatus])

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const { start_date, end_date } = buildRange(rangeKey);
      await fetchDashboard({ start_date, end_date });
      await register();
    } finally {
      setRefreshing(false);
    }
  };

  const [hourlyActivity, setHourlyActivity] = useState({
    hours: [],
    calls: [],
    messages: [],
    maxY: 10
  });

  useEffect(() => {
    const { start_date, end_date } = buildRange(rangeKey);
    fetchDashboard({ start_date, end_date });

    messaging().onMessage(async (remoteMessage) => {
      quietRefresh()
    });
  }, [rangeKey]);

  const transformRecentActivity = (item) => {
    const isCallLog = item.last_message.type == 'call';
    
    if (isCallLog) {
      // Handle call log
      const callLog = item;
      const metadata = callLog.metadata || {};
      const direction = (callLog.last_message.metadata.call_direction || '').toLowerCase();
      const duration = callLog.last_message.metadata.duration || 0;
      
      let callType = 'incoming';
      let callText = 'Incoming call';
      
      if (direction === 'outbound') {
        callType = 'outgoing';
        callText = 'Outgoing call';
      } else if (direction === 'inbound' && duration === 0) {
        callType = 'missed';
        callText = 'Missed call';
      }

      const phoneNumber = extractPhoneNumber(callLog);

      return {
        id: `call_${callLog.id}_${item.id}`,
        conversation_id: null,
        lead_id: item.id,
        name: item.customer_name || item.unique_identifier || 'Unknown',
        type: 'call',
        text: callText,
        time: formatChatTime(callLog.created_at),
        rawTimestamp: callLog.created_at,
        profile_pic: item.profileImage || undefined,
        channel_icon: item.channel?.image ? { uri: item.channel.image } : undefined,
        channel: item.channel ? { image: item.channel?.image ? { uri: item.channel.image } : undefined } : undefined,
        callDirection: direction,
        callDuration: duration,
        callStatus: callType,
        phoneNumber: phoneNumber,
      };
    } else {
      // Handle message
      if (!item.last_message) return null;

      return {
        id: String(item.id),
        conversation_id: item.last_message?.conversation || null,
        lead_id: item.lead?.id,
        name: item?.customer_name || item.lead?.name || 'Unknown',
        type: 'message',
        text: cleanPreview(item.last_message.content || ''),
        time: formatChatTime(item?.last_message?.updated_at),
        rawTimestamp: item?.last_message?.updated_at,
        profile_pic: item?.customer?.image || item?.last_message?.lead_receiver_details?.image || item?.last_message?.user_sender_details?.image || undefined,
        channel_icon: item?.last_message?.channel?.image ? { uri: item.last_message.channel.image } : undefined,
        channel: item.last_message?.channel ? { image: item.last_message?.channel?.image ? { uri: item.last_message?.channel.image } : undefined } : undefined,
        unreadCount: item.unreadCount || 0,
      };
    }
  };

  const recentActivities = useMemo(() => {
    return (recentConversations || [])
      .map(transformRecentActivity)
      .filter(item => item !== null);
  }, [recentConversations]);

  const fetchDashboard = useCallback(async ({ start_date, end_date }, opts = {}) => {
    const { silent = false } = opts;
    console.log('[Dashboard] fetching data for range');

    try {
      console.log('[Dashboard] fetching data for range', start_date, end_date, 'silent:', silent);
      if (!silent) setLoading(true);

      // Fetch analytics data
      const res = await api.get('analytics/summary/mobile/dashboard/', {
        params: { start_date, end_date },
      });
      const d = res?.data?.data || {};
      
      setStats({
        total_calls: d.total_calls?.count ?? 0,
        total_messages: d.total_messages?.count ?? 0,
        total_users: d.total_users ?? 0,
        total_new_leads: d.new_leads?.count,
        total_returning_leads: d.returning_leads?.count
      });
      
      setDeltas({
        calls_pct: d.total_calls.percent_change,
        msgs_pct: d.total_messages.percent_change
      });
      
      setChannelsStats(Array.isArray(d.messages_per_channel) ? d.messages_per_channel.map(c => ({
        name: c.name,
        value: c.total_messages,
        icon: c.icon,
      })) : []);
      
      setActiveChannels(Array.isArray(d.messages_per_channel) ? d.messages_per_channel : []);
      setNewLeads(d.new_leads.data);
      setReturningLeads(d.returning_leads.data);
      
      setInsight(getBusiestChannelInsight(d.busiest_channel));
      setInsightRemark(d.remark);
      
      setHourlyActivity(
        d.hourly_activity ? transformHourlyActivity(d.hourly_activity) : {
          hours: [],
          calls: [],
          messages: [],
          maxY: 10
        }
      );
  
      // Fetch recent activities from contacts endpoint
      const contactsRes = await api.get('/communication/recent/', {
        params: {
          page_size: 5,
          page: 1
        },
      });
      
      const contactResults = Array.isArray(contactsRes?.data?.results) ? contactsRes.data.results : [];
      setRecentConversations(contactResults);
      
      console.log('[Dashboard] fetch complete, silent:', silent);
    } catch (e) {
      console.log('[Dashboard] fetch error:', e?.message);
      if (!silent) handleApiError?.(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [api, setLoading, handleApiError]);

  // choose card width based on data presence
  const halfOrFull = (isHalf) => [styles.statCard, isHalf ? styles.cardHalf : styles.cardFull];

  const handleActivityPress = (item) => {
    if (item.type === 'call') {
      // For calls, dial the number
      if (item.phoneNumber) {
        dial(item.phoneNumber);
      } else {
        console.warn('No phone number available for this call');
      }
      return;
    }
  
    // For messages
    navigation.navigate('ConversationScreen', {
      contactId: item.lead_id || item.customer_id,
      contact: {
        id: item.lead_id || item.customer_id,
        name: item.name,
        image: item.profile_pic,
        channel: item.channel,
        lastMessageData: { content: item.text },
        last_message_at: item.rawTimestamp,
      },
      conversationId: item.conversation_id,
    });
  };

  const handleSeeAllPress = () => {
    navigation.navigate('RecentActivities');
  }; 

  const handleDialerPress = () => {
    navigation.navigate('Dialer');
  };

  const RecentEmpty = ({ onPress }) => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>💬</Text>
      <Text style={styles.emptyTitle}>No recent activity</Text>
      <Text style={styles.emptySub}>
        New messages and calls will show up here.
      </Text>
    </View>
  );

  // ---- silent/queued refresh helpers ----
  const quietRefresh = useCallback(async () => {
    const { start_date, end_date } = buildRange(rangeKey);
    await fetchDashboard({ start_date, end_date }, { silent: true });
  }, [rangeKey, fetchDashboard]);

  return (
    <View style={styles.container}>
      <EnableNotificationsBanner />
      {/* SIP registration pill */}
      <TouchableOpacity
          onPress={onPressRegistration}
          activeOpacity={0.85}
          style={[
            styles.regBadge,
            { backgroundColor: color.bg, borderColor: color.border }
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.regDot, { color: color.dot }]}>•</Text>
          <Text
            style={[styles.regText, { color: color.text }]}
            numberOfLines={1}
          >
            {checkingReg
              ? 'Checking…'
              : regLine}
          </Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text
          style={styles.greeting}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Hi, {company?.name} 😊
        </Text>

        <View style={styles.headerActions}>
          {/* Range dropdown trigger */}
          <TouchableOpacity
            onPress={() => setRangeMenuOpen(true)}
            style={styles.rangePill}
              activeOpacity={0.85}
            >
            <Text style={styles.rangePillText}>
                  {RANGE_OPTIONS.find(o => o.key === rangeKey)?.label}
            </Text>
              {/* caret without needing an asset */}
                  <Text style={styles.caretText}>▾</Text>
          </TouchableOpacity>

          {/* Bell (your bell.png already has the red dot) */}
          <BellButton style={styles.BellButton} hitSlop={{top:10,left:10,bottom:10,right:10}} navigation={navigation}/>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={[styles.statCard, {backgroundColor: '#E0EDFF'}]}>
            <Text style={styles.statTitle}>TOTAL CALLS</Text>
            <Text style={styles.statValue}>{stats?.total_calls}</Text>
            <View style={styles.deltaRow}>
              <Text style={[styles.deltaNumber, { color: pctColor(deltas.calls_pct) }]}>
                  {pctArrow(deltas.calls_pct)} {pctNumber(deltas.calls_pct)}
              </Text>
              {/* <Text style={styles.deltaSuffix}> vs yesterday</Text> */}
            </View>
          </TouchableOpacity>

          <View style={[styles.statCard, {backgroundColor: '#EAF8E5'}]}>
                <Text style={styles.statTitle}>TOTAL MESSAGES</Text>
            <Text style={styles.statValue}>{stats?.total_messages}</Text>
            <View style={styles.deltaRow}>
             <Text style={[styles.deltaNumber, { color: pctColor(deltas.msgs_pct) }]}>
                {pctArrow(deltas.msgs_pct)} {pctNumber(deltas.msgs_pct)}
             </Text>
              {/* <Text style={styles.deltaSuffix}> vs yesterday</Text> */}
          </View>
        </View>

        {stats.total_new_leads > 0 ? (
        <View style={halfOrFull(stats.total_returning_leads > 0)}>
          <Text style={styles.statTitleCompact} numberOfLines={1}>NEW CUSTOMERS</Text>
          <Text style={styles.bigCount}>{stats.total_new_leads}</Text>
          <AvatarGroup items={newLeads} max={(stats.total_returning_leads ? 5 : 10)} size={32} onOverflowPress={goToCustomers} />
        </View>
        ): null}

        {stats.total_returning_leads > 0 ? (
          <View style={halfOrFull(stats.total_new_leads)}>
            <Text style={styles.statTitleCompact} numberOfLines={1}>RETURNING CUSTOMERS</Text>
            <Text style={styles.bigCount}>{stats.total_returning_leads}</Text>
            <AvatarGroup items={returningLeads} max={(stats.total_new_leads > 0 ? 5 : 10)} size={32} onOverflowPress={goToCustomers} />
          </View>
        ): null}
        
        </View>
          {/* Add User Button */}
          <View style={styles.usersCard}>
            <TouchableOpacity onPress={() => navigation.navigate('Users')} style={{width: '40%'}}>
              <Text style={styles.statTitle}>TEAM MEMBERS</Text>
              <Text style={styles.statValue}>{stats?.total_users}</Text>
            </TouchableOpacity>
            {
              canInviteUsers && (
            <TouchableOpacity style={styles.addUserButton} onPress={() => navigation.navigate('AddUser')}>
              <Text style={styles.addUserText}>Invite users</Text>
            </TouchableOpacity>
              )
            }
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
            {recentActivities.length > 0 ? (
              <FlatList
                  data={recentActivities}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                  <TouchableOpacity
                        style={styles.activityItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleActivityPress(item)
                        }}
                        activeOpacity={0.8}
                      >
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
                          <Text style={styles.activityName} numberOfLines={1} ellipsizeMode="tail">
                            {item.name}
                          </Text>
                          {item.type == 'call' &&
                            <View style={{flexDirection: 'row', gap: 8}}>
                              <Text style={styles.activityTime}>{item.time}</Text>
                              <Image
                                source={require('../../../assets/call_ic.png')} 
                                style={styles.makeCallIcon}
                                resizeMode="contain"
                              />
                            </View>
                          }
                        </View>

                        <View style={styles.activitySnippetRow}>
                            {item.type === 'call' && item.text === 'Missed call' && (
                          <Image source={require('../../../assets/missed.png')} style={styles.infoIcon} resizeMode="contain" />
                          )}
                            {item.type === 'call' && item.text === 'Outgoing call' && (
                          <Image source={require('../../../assets/outgoing.png')} style={styles.infoIcon} resizeMode="contain" />
                          )}
                            {item.type === 'call' && item.text === 'Incoming call' && (
                            <Image source={require('../../../assets/incoming.png')} style={styles.infoIcon} resizeMode="contain" />
                        )}

                      <Text
                        style={styles.activitySnippet}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                          {item.text}
                      </Text>
                    </View>

                      </View>
                    </View>
                  </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              ) : (
                    !loading && <RecentEmpty onPress={handleSeeAllPress} />
              )}
          </View>
      </ScrollView>
      
      <TouchableOpacity
        onPress={handleDialerPress}
        style={{
          width: 90,
          height: 90,
          position: 'absolute',
          bottom: 5,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Image
          source={require('../../../assets/dialer.png')}
          style={{width: 90, height: 90}}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Modal
        visible={rangeMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRangeMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRangeMenuOpen(false)}
        >
          <View style={styles.menuCard}>
            {RANGE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.menuItem, opt.key === rangeKey && styles.menuItemActive]}
                onPress={() => { setRangeKey(opt.key); setRangeMenuOpen(false); }}
              >
                <Text
                  style={[styles.menuItemText, opt.key === rangeKey && styles.menuItemTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
        </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  hotlineContainer: {
    width: '100%',
    paddingTop: 15, 
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    maxWidth: '60%',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 0,
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
    borderColor: '#DFE1E6',
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
  makeCallIcon: {
    width: 25,
    height: 25
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
    maxWidth: '60%',
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
  headerRow: {
  paddingHorizontal: 20,
  paddingTop: 10,
  paddingBottom: 20,
  backgroundColor: '#F7F7F7',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
rangePill: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 8,
  backgroundColor: '#F3F4F6',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
rangePillText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#111827',
},
caretText: { marginLeft: 6, fontSize: 12, opacity: 0.7 },
bellBtn: {
  width: 36, height: 36, borderRadius: 18,
  justifyContent: 'center', alignItems: 'center',
  backgroundColor: 'white',
  borderWidth: 1, borderColor: '#E5E7EB',
},

// modal menu
modalBackdrop: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
},
menuCard: {
  width: 220,
  backgroundColor: 'white',
  borderRadius: 12,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 6,
},
menuItem: { paddingVertical: 12, paddingHorizontal: 14 },
menuItemActive: { backgroundColor: '#F0FDF4' },
menuItemText: { fontSize: 14, color: '#111827' },
menuItemTextActive: { color: '#16A34A', fontWeight: '700' },
activitySnippetRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

activitySnippet: {
  flex: 1,            // << lets it occupy remaining space
  flexShrink: 1,      // << avoid pushing icons out
  fontSize: 14,
  color: '#666666',
  // optional: ensure ellipsis works on Android too
  includeFontPadding: false,
},
emptyWrap: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 24,
  paddingHorizontal: 16,
  borderRadius: 10,
  backgroundColor: '#FAFAFA',
  borderWidth: 1,
  borderColor: '#DFE1E6',
},
emptyEmoji: { fontSize: 32, marginBottom: 8 },
emptyTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 4,
},
emptySub: {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center',
  marginBottom: 12,
},
emptyBtn: {
  marginTop: 4,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: colors.primary,
},
emptyBtnText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600',
},
deltaText: {
  marginTop: 6,
  fontSize: 12,
  fontWeight: '600',
},
deltaRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
deltaNumber: { fontSize: 12, fontWeight: '700' },      // green/red/gray
deltaSuffix: { fontSize: 12, fontWeight: '400', color: '#111827' }, // black
bigCount: {
  fontSize: typography.heading1.fontSize,
  fontWeight: 'bold',
  color: '#111827',
  marginTop: 2,
},

plusBubble: {
  backgroundColor: '#E5E7EB',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: -5,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#D1D5DB',
},
plusBubbleText: { fontSize: 12, fontWeight: '700', color: '#111827' },
cardHalf: { width: '48%', backgroundColor: 'white', borderColor: '#DFE1E6', borderWidth: 1, padding: 15, borderRadius: 10, marginTop: 15 },
cardFull: { width: '100%', backgroundColor: 'white', borderColor: '#DFE1E6', borderWidth: 1, padding: 15, borderRadius: 10, marginTop: 15 },
insightsCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#DFE1E6',
  paddingHorizontal: 16,
  paddingVertical: 14,
  marginBottom: 20,
},

insightsHeading: {
  fontSize: 14,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 10,
},

insightsContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',    // center the whole row like the Figma
  gap: 10,
  paddingVertical: 4,
  paddingHorizontal: 16,
},

insightsIconWrap: {
  width: 25,
  height: 25,
  borderRadius: 12,
  backgroundColor: '#F6F7FB',  // subtle oval/pill background
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#E6E8EE',
},

insightsMessage: {
  fontSize: 14,
  color: '#111827',
},
statTitleCompact: {
  fontSize: 11,      // smaller so it fits in one line
  fontWeight: '700',
  color: '#111827',
  marginBottom: 6,
  letterSpacing: 0.2,
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
missedText: {
  color: '#F44336',
},
regBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingHorizontal: 10,
  paddingVertical: 3,
  gap: 3,
},
regDot: { fontSize: 30, lineHeight: 10 },
regText: { fontSize: 12, fontWeight: '700' },

});

export default AgentDashboard;