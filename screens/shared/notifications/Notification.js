import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { clearUnread } from './unread';
import { useUnread } from './UnreadProvider';
import notifee from '@notifee/react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SectionList,
  FlatList,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Avatar from '../../../components/Avatar';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import {formatChatTime} from '../../../utils/timeUtils'


// --------- helpers ----------
// ---------------- helpers ----------------
function receiverNameFromNotification(n) {
  const r = n?.receiver || {};
  if (r.first_name) return `${r.first_name} ${r.last_name ?? ''}`.trim();
  return r.email || 'System';
}

// Pull a name from activity description like
// "New message received from Awesome Urch"
function nameFromDescription(desc) {
  if (!desc) return 'System';
  const m = desc.match(/from\s+(.+)$/i);
  return (m && m[1]) ? m[1].trim() : desc.slice(0, 24);
}

function titleFromAction(log) {
  const a = (log?.action || '').toLowerCase();
  const ch = log?.metadata?.channel || 'Nativetalk';
  if (a === 'new_message') return `New Message`;
  if (a === 'message_read' || a === 'read') return 'Message marked as read';
  if (a === 'badge_cleared') return 'Notification badge cleared';
  // Fallback: pretty-print action
  return a.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

function groupByWeek(items) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const thisWeek = [];
  const earlier = [];
  for (const it of items) (new Date(it.created_at) >= monday ? thisWeek : earlier).push(it);

  const sortDesc = (a, b) => new Date(b.created_at) - new Date(a.created_at);
  const sections = [];
  if (thisWeek.length) sections.push({ title: 'This Week', data: thisWeek.sort(sortDesc) });
  if (earlier.length) sections.push({ title: 'Earlier', data: earlier.sort(sortDesc) });
  return sections;
}

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeaderWrap}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Tabs = { PRIMARY: 'Primary', ACTIVITY: 'Activity log' };

const Notifications = ({navigation}) => {
  const { setUnreadCountState } = useUnread();
  const [tab, setTab] = useState(Tabs.PRIMARY);

  const {api} = useApi()
  const { loading,setLoading } = useLoading();
  const { handleApiError } = useError();

  const openActivityConversation = (item) => {
  const contactId = item.contactId;
  if (!contactId) return; // nothing to open

  navigation.navigate('ConversationScreen', {
    contactId,
    // contact: {
    //   id: contactId,
    //   name: item.seedName,                     // initials show immediately
    //   image: null,
    //   channel: item.channelName ? { name: item.channelName, image: null } : null,
    //   lastMessageData: { content: item.preview },
    //   last_message_at: item.created_at,
    // },
  });
};

  // Primary state
  const [primaryData, setPrimaryData] = useState([]);
  const [primaryNext, setPrimaryNext] = useState(null);
  const [primaryRefreshing, setPrimaryRefreshing] = useState(false);
  const [primaryMoreLoading, setPrimaryMoreLoading] = useState(false);
  const primaryHasLoadedRef = useRef(false);

  // Activity state
  const [activityItems, setActivityItems] = useState([]);
  const [activityNext, setActivityNext] = useState(null);
  const [activityRefreshing, setActivityRefreshing] = useState(false);
  const [activityMoreLoading, setActivityMoreLoading] = useState(false);
  const activityHasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await clearUnread();
        setUnreadCountState(0);
        try { await notifee.setBadgeCount(0); } catch {}
      })();
    }, [setUnreadCountState])
  );

  useEffect(() => {
    if (!primaryHasLoadedRef.current) {
      loadPrimary(true);
    }
  }, []);

  // Lazy-load Activity the first time user taps it
  useEffect(() => {
    if (tab === Tabs.ACTIVITY && !activityHasLoadedRef.current) {
      loadActivity(true);
    }
  }, [tab]);

    // ---------- API loaders ----------
  async function loadPrimary(initial = false, urlOverride = null) {
    const url = urlOverride || '/notifications';
    try {
      if (initial) setLoading(true);
      const res = await api.get(url);
      // payload: { success, notifications, count, next, previous, unread_count }
      const { notifications = [], next = null } = res.data || {};
      const mapped = notifications.map((n) => ({
        id: String(n.id),
        title: n.title || 'Notification',
        preview: n.description || '', // best-effort
        created_at: n.created_at || n.updated_at || n.timestamp || new Date().toISOString(),
        receiver: n.receiver || null,
        unread_count: n.unread_count || 0,
      }));
      primaryHasLoadedRef.current = true;
      setPrimaryData(prev => (urlOverride ? [...prev, ...mapped] : mapped));
      setPrimaryNext(next);
    } catch (e) {
      handleApiError(e);
    } finally {
      if (initial) setLoading(false);
      setPrimaryRefreshing(false);
      setPrimaryMoreLoading(false);
    }
  }

  async function loadMorePrimary() {
    if (!primaryNext || primaryMoreLoading) return;
    setPrimaryMoreLoading(true);
    // next can be absolute; axios instance can handle it, else fall back to page param
    try {
      await loadPrimary(false, primaryNext);
    } catch {
      setPrimaryMoreLoading(false);
    }
  }

  async function refreshPrimary() {
    setPrimaryRefreshing(true);
    await loadPrimary(false, '/notifications'); // reset to first page
  }

  async function loadActivity(initial = false, urlOverride = null) {
    const url = urlOverride || '/activity-logs/';
    try {
      if (initial) setLoading(true);
      const res = await api.get(url);
      // payload: { success, logs, count, next, previous }
      const { logs = [], next = null } = res.data || {};
      const mapped = logs.map((log) => ({
        id: String(log.id),
        title: titleFromAction(log),
        preview: log.description || '',
        created_at: log.created_at,
        receiver: { email: nameFromDescription(log.description) }, // for Avatar initials
        contactId: log?.metadata?.lead_id ?? null,
        channelName: log?.metadata?.channel ?? null,
        seedName: nameFromDescription(log.description) || 'Unknown',
      }));
      activityHasLoadedRef.current = true;
      setActivityItems(prev => (urlOverride ? [...prev, ...mapped] : mapped));
      setActivityNext(next);
    } catch (e) {
      handleApiError(e);
    } finally {
      if (initial) setLoading(false);
      setActivityRefreshing(false);
      setActivityMoreLoading(false);
    }
  }

  async function loadMoreActivity() {
    if (!activityNext || activityMoreLoading) return;
    setActivityMoreLoading(true);
    try {
      await loadActivity(false, activityNext);
    } catch {
      setActivityMoreLoading(false);
    }
  }

  async function refreshActivity() {
    setActivityRefreshing(true);
    await loadActivity(false, '/activity-logs/');
  }

 // ---------- derived ----------
  const activitySections = useMemo(() => groupByWeek(activityItems), [activityItems]);

 const renderItem = ({ item }) => {
  const content = (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        <Avatar
          name={receiverNameFromNotification(item)}
          size={40}
          image={null}
          badge={null}
        />
      </View>

      <View style={styles.rowCenter}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {!!item.preview && (
          <Text style={styles.preview} numberOfLines={1}>{item.preview}</Text>
        )}
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.time}>{formatChatTime?.(item.created_at) || ''}</Text>
        {item.unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Only Activity log rows should navigate
  return tab === Tabs.ACTIVITY
    ? (
        <TouchableOpacity activeOpacity={0.7} onPress={() => openActivityConversation(item)}>
          {content}
        </TouchableOpacity>
      )
    : content;
};



  const ListFooter = ({ loading }) =>
    loading ? (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator />
      </View>
    ) : <View style={{ height: 24 }} />;
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
    
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.headerRight} />
          </ImageBackground>

           {/* Tabs */}
      <View style={styles.tabs}>
        {[Tabs.PRIMARY, Tabs.ACTIVITY].map(label => {
          const active = tab === label;
          return (
            <TouchableOpacity
              key={label}
              onPress={() => setTab(label)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lists */}
      {tab === Tabs.PRIMARY ? (
        <FlatList
          data={primaryData}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMorePrimary}
          refreshControl={
            <RefreshControl refreshing={primaryRefreshing} onRefresh={refreshPrimary} />
          }
          ListFooterComponent={<ListFooter loading={primaryMoreLoading} />}
        />
      ) : (
        <SectionList
          sections={activitySections}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => <SectionHeader title={title} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMoreActivity}
          refreshControl={
            <RefreshControl refreshing={activityRefreshing} onRefresh={refreshActivity} />
          }
          ListFooterComponent={<ListFooter loading={activityMoreLoading} />}
        />
      )}
    </View>
  );
}

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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: { backgroundColor: '#E7F7E1', borderColor: '#E7F7E1' },
  tabText: { color: '#475569', fontWeight: '600' },
  tabTextActive: { color: '#15803D' },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    fontWeight: '700',
    color: '#0F172A',
  },

 row: {
  flexDirection: 'row',
  alignItems: 'flex-start',     // top align like Figma
  paddingHorizontal: 16,
  paddingVertical: 16,          // more vertical air
  backgroundColor: '#fff',
},

avatarWrap: {
  marginTop: 2,                 // nudge to align with title baseline
},

rowCenter: {
  flex: 1,
  marginLeft: 12,
  paddingRight: 12,             // keep space from the time
  flexShrink: 1,
},

rowRight: {
  alignItems: 'flex-end',
  flexShrink: 0,
  alignSelf: 'flex-start',      // lock time to top
  minWidth: 72,                 // keeps layout stable
},

title: {
  fontSize: 16,
  fontWeight: '700',
  color: '#0F172A',
  lineHeight: 22,               // taller line for clarity
  marginBottom: 6,              // space between title & preview (key change)
},

preview: {
  fontSize: 12,
  color: '#64748B',
  lineHeight: 20,
},

time: {
  fontSize: 12,
  color: '#94A3B8',
  lineHeight: 18,
  marginTop: 2,
},

separator: {
  height: 1,
  backgroundColor: '#EEF2F6',  // slightly lighter than before
  marginLeft: 68,               // skip under avatar to match Figma feel
  marginRight: 16,
},
  badge: {
    marginTop: 6,
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // separator: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  sectionHeaderWrap: {
  backgroundColor: '#fff',
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 6,
  borderTopWidth: 1,
  borderTopColor: '#F1F5F9',
  zIndex: 1,            // avoids visual overlap during stickiness
},
sectionHeaderText: { fontWeight: '700', color: '#0F172A' },

})

export default Notifications
