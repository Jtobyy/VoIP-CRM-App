import React,{useState,useEffect,useMemo} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image,Modal, } from 'react-native';
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
import { ActivityChartBlock } from '../../../components/ActivityChart';
import TestBarChat from '../../../components/TestBarChat';

const PREVIEW_LEN = 80;
const cleanPreview = (s = '') =>
  String(s)
    .replace(/\*\*(.*?)\*\*/g, '$1')      // drop **markdown**
    .replace(/[_`>#*-]/g, '')             // drop leftover md chars
    .replace(/\s+/g, ' ')                  // collapse whitespace/newlines
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
    case 'thisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { label: 'This month', start_date: toYMD(start), end_date: toYMD(end) };
    default:
      start.setDate(start.getDate() - 1);
      return { label: 'Last 24 hrs', start_date: toYMD(start), end_date: toYMD(end) };
  }
};

const RANGE_OPTIONS = [
  { key: '24h', label: 'Last 24 hrs' },
  { key: '48h', label: 'Last 48 hrs' },   // NEW
  { key: '3d',  label: 'Last 3 days' }, 
  { key: '7d',  label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This month' },
  // { key: 'custom', label: 'Custom range' }, // wire up later if needed
];

// helpers stay the same
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



const AdminDashboard = ({ navigation }) => {
  const {company} = useAuth()
  const { canInviteUsers } = useAuth();
  console.log('company:',company)

  const goToCustomers = () => {
  navigation.navigate('Main', { screen: 'Customers' });  // Tab screen name
};
 
  const [deltas, setDeltas] = useState({ calls_pct: 10.5, msgs_pct: 10.5 });

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
const recentActivities = useMemo(() => {
  return (recentConversations || []).map(c => ({
    id: String(c.conversation_id),
    conversation_id: c.conversation_id,          // 👈 keep for convenience
    lead_id: c.lead_id,                           // 👈 needed for contactId
    name: c.lead_name || `Lead #${c.lead_id}`,
    type: 'message',
    text: cleanPreview(c?.latest_message?.content || ''),
    time: formatChatTime(c?.latest_message?.created_at),
    rawTimestamp: c?.latest_message?.created_at,  // optional
    profile_pic: undefined,                       // add when you have it
    channel_icon: c?.channel?.icon ? { uri: c.channel.icon } : undefined,
    channel: { image: c?.channel?.icon ? { uri: c.channel.icon } : undefined }, // 👈 matches MessageList shape
  }));
}, [recentConversations]);


useEffect(() => {
  const { start_date, end_date } = buildRange(rangeKey);
  fetchDashboard({ start_date, end_date });
}, [rangeKey]);


const fetchDashboard = async ({ start_date, end_date }) => {
  console.log('Fetching dashboard data for range:',start_date,end_date)
  try {
    setLoading(true);
    // 🔁 call your API. adjust URL/params to match your backend.
    const res = await api.get('analytics/summary/mobile/', {
      params: { start_date, end_date },
    });
     const d = res?.data?.data || {};
     console.log('dashboard data:',d)
    setStats({
      total_calls: d.total_calls ?? 0,
      total_messages: d.total_messages ?? 0,
      total_users: d.total_users ?? 0,
    });
    setActiveChannels(Array.isArray(d.active_channels) ? d.active_channels : []);
    setNewLeads(Array.isArray(d.new_leads) ? d.new_leads : []);
    setReturningLeads(Array.isArray(d.returning_leads) ? d.returning_leads : []);
    setRecentConversations(Array.isArray(d.recent_conversations) ? d.recent_conversations: []);
    console.log('stats:',stats)
  } catch (e) {
    handleApiError?.(e);
  } finally {
    setLoading(false);
  }
};

const handleActivityPress = (item) => {
  if (item.type !== 'message') return;  // only for messages (as requested)

  navigation.navigate('ConversationScreen', {
    contactId: item.lead_id,   // 👈 same key name your MessageList uses
    contact: {
      id: item.lead_id,
      name: item.name,
      image: item.profile_pic,
      channel: item.channel,                 // { image: { uri: ... } }
      lastMessageData: { content: item.text },
      last_message_at: item.rawTimestamp,
    },
    // optional if ConversationScreen supports it:
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
{/* 
    <TouchableOpacity style={styles.emptyBtn} onPress={onPress}>
      <Text style={styles.emptyBtnText}>View messages</Text>
    </TouchableOpacity> */}
  </View>
);

  return (
    <View style={styles.container}>
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


      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={[styles.statCard, {backgroundColor: '#E0EDFF'}]}>
             <Text style={styles.statTitle}>TOTAL CALLS</Text>
            <Text style={styles.statValue}>{stats?.total_calls}</Text>
          <View style={styles.deltaRow}>
             <Text style={[styles.deltaNumber, { color: pctColor(deltas.calls_pct) }]}>
                {pctArrow(deltas.calls_pct)} {pctNumber(deltas.calls_pct)}
            </Text>
            <Text style={styles.deltaSuffix}> vs yesterday</Text>
          </View>
          </TouchableOpacity>

          <View style={[styles.statCard, {backgroundColor: '#EAF8E5'}]}>
                <Text style={styles.statTitle}>TOTAL MESSAGES</Text>
            <Text style={styles.statValue}>{stats?.total_messages}</Text>
            <View style={styles.deltaRow}>
             <Text style={[styles.deltaNumber, { color: pctColor(deltas.msgs_pct) }]}>
                {pctArrow(deltas.msgs_pct)} {pctNumber(deltas.msgs_pct)}
             </Text>
              <Text style={styles.deltaSuffix}> vs yesterday</Text>
          </View>
          </View>

                  {activeChannels.length > 0 && (
  <View style={[styles.statCard, { backgroundColor: '#F2F2F2' }]}>
    <Text style={styles.statTitle}>MOST ACTIVE CHANNELS</Text>
    <Text style={styles.bigCount}>{activeChannels.length}</Text>
    <AvatarGroup items={activeChannels} max={5} size={32}  onOverflowPress={goToCustomers}/>
  </View>
)}

    {newLeads.length > 0 && (
  <View style={[styles.statCard, { backgroundColor: 'white', borderColor: '#DFE1E6', borderWidth: 1 }]}>
    <Text style={styles.statTitle}>NEW CUSTOMERS</Text>
    <Text style={styles.bigCount}>{newLeads.length}</Text>
    <AvatarGroup items={newLeads} max={5} size={32}  onOverflowPress={goToCustomers}/>
  </View>
)}
        </View>

       {/* Activity chart */}
        {/* <View style={{ marginTop: 8, marginBottom: 16 }}>
             <ActivityChartBlock />
         </View> */}
           <View style={{ marginTop: 8, marginBottom: 16 }}>
             <TestBarChat/>
         </View>

        {/* Most Active Customers */}
        {
          returningLeads.length>0 &&
          <View style={[styles.section, {backgroundColor: '#FAFAFA', borderColor: '#DFE1E6', borderWidth: 1, padding: 15}]}>
          <View>
            <Text style={styles.statTitle}>RETURNING</Text>
            <Text style={styles.statTitle}>CUSTOMERS</Text>
          </View>
          <View style={styles.activeCustomers}>
            {returningLeads.map((customer, index) => (
              <Avatar 
                key={index} 
                name={customer.name} 
                size={35} 
                style={{ marginRight: -5, marginBottom: 8 }}
              />
            ))}
          </View>
        </View>
        }

        {/* Add User Button */}
        <View style={styles.usersCard}>
          <TouchableOpacity onPress={() => navigation.navigate('Users')} style={{width: '40%'}}>
            <Text style={styles.statTitle}>TOTAL NUMBER OF USERS</Text>
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
                   onPress={() => handleActivityPress(item)}
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
                          source={require('../../../assets/info.png')} 
                          style={styles.infoIcon}
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
  paddingTop: 80,
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
});

export default AdminDashboard;