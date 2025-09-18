import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  ScrollView,
  Keyboard,
  ImageBackground,
  TouchableWithoutFeedback,
  ActivityIndicator,
  SectionList,
  RefreshControl,
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import Avatar from '../../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';

// ---- Helpers ---------------------------------------------------------------

// Format a UTC ISO date to Africa/Lagos local date label, e.g. 'MON, MAY 6, 2023'
const dateLabel = (iso) => {
  try {
    const d = new Date(iso);
    // Weekday, Month, Day, Year (uppercase like your UI)
    const opts = { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const s = new Intl.DateTimeFormat('en-NG', opts).format(d);
    // Convert "Mon, May 6, 2023" => "MON, MAY 6, 2023"
    return s.toUpperCase();
  } catch {
    return '';
  }
};

// Format time (e.g., '10:33 PM') in Africa/Lagos
const timeLabel = (iso) => {
  try {
    const d = new Date(iso);
    const opts = { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit' };
    return new Intl.DateTimeFormat('en-NG', opts).format(d);
  } catch {
    return '';
  }
};

// Determine UI type: 'missed' | 'incoming' | 'outgoing'
const computeType = (item) => {
  const dir = (item.call_direction || '').toLowerCase();
  if (dir === 'inbound' && (item.duration === '00:00' || item.duration === '0:00')) return 'missed';
  if (dir === 'inbound') return 'incoming';
  if (dir === 'outbound') return 'outgoing';
  return 'outgoing';
};

// Pick the label we show as the "name/number"
const displayName = (item) => {
  // caller_id often looks like:  "Nativetalk_support <02014131234>" or "\"+234...\" <0916...>"
  const cid = item.caller_id || '';
  const called = item.called_number || '';
  const dir = (item.call_direction || '').toLowerCase();

  // Prefer: inbound => show caller_id; outbound => show called_number (or caller_id as fallback)
  if (dir === 'inbound') return cid.replace(/"/g, '') || called;
  return called || cid.replace(/"/g, '');
};

// Assets for icon row
const getCallIconSource = (type) => {
  switch (type) {
    case 'missed': return require('../../../assets/missed.png');
    case 'incoming': return require('../../../assets/incoming.png');
    case 'outgoing': return require('../../../assets/outgoing.png');
    default: return require('../../../assets/outgoing.png');
  }
};

const getCallTypeText = (type) => {
  if (type === 'missed') return 'Missed call';
  if (type === 'incoming') return 'Incoming call';
  return 'Outgoing call';
};

// Build absolute next URL when API returns "?page=2"
const buildNextUrl = (base, next) => {
  if (!next) return null;
  if (next.startsWith('?')) return `${base}${next}`;
  return next; // in case backend already returns absolute URL
};

// ---- Component -------------------------------------------------------------

const CallLogs = ({ navigation }) => {
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  const ENDPOINT = '/call-center/cdrs/pbx/';

  const [activeFilter, setActiveFilter] = useState('All calls');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState([]);          // raw items from API (all pages loaded so far)
  const [nextUrl, setNextUrl] = useState(null);    // for pagination
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Fetch page (used for both first load and pagination)
  const fetchPage = useCallback(async (url) => {
    const res = await api.get(url);
    // Expect: { success, count, next, previous, results: [] }
    const { results = [], next = null } = res?.data || {};
    // Results are already latest->oldest by call_start
    setItems(prev => prev.concat(results));
    setNextUrl(buildNextUrl(ENDPOINT, next));
  }, []);

  // ---- Initial load
  useEffect(() => {
    (async () => {
      try {
        setInitialLoading(true);
        // Enforce ordering server-side if your API supports it:
        // const url = `${ENDPOINT}?ordering=-call_start`;
        const url = `${ENDPOINT}`;
        await fetchPage(url);
      } catch (e) {
        handleApiError(e);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [ENDPOINT, fetchPage]);

  // ---- Infinite scroll
  const loadMore = useCallback(async () => {
    if (!nextUrl || fetchingMore || initialLoading) return;
    try {
      setFetchingMore(true);
      await fetchPage(nextUrl);
    } catch (e) {
      handleApiError(e);
    } finally {
      setFetchingMore(false);
    }
  }, [nextUrl, fetchingMore, initialLoading, fetchPage, handleApiError]);

  // ---- Pull to refresh (reload from first page)
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setItems([]);
      setNextUrl(null);
      const url = `${ENDPOINT}`;
      await fetchPage(url);
    } catch (e) {
      handleApiError(e);
    } finally {
      setRefreshing(false);
    }
  }, [ENDPOINT, fetchPage, handleApiError]);

  // ---- Decorate items with UI fields (type, name, time, dateLabel)
  const decorated = useMemo(() => {
    return items.map((r) => {
      const type = computeType(r);
      return {
        ...r,
        __type: type,
        __name: displayName(r),
        __time: timeLabel(r.call_start || r.created_at),
        __dateLabel: dateLabel(r.call_start || r.created_at),
      };
    });
  }, [items]);

  // ---- Filtering by tab + search
  const filtered = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();

    return decorated.filter((it) => {
      const matchesSearch =
        !q ||
        it.__name.toLowerCase().includes(q) ||
        (it.called_number || '').toLowerCase().includes(q) ||
        (it.caller_id || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'Missed')   return it.__type === 'missed';
      if (activeFilter === 'Incoming') return it.__type === 'incoming';
      if (activeFilter === 'Outgoing') return it.__type === 'outgoing';
      return true; // All calls
    });
  }, [decorated, activeFilter, searchQuery]);

  // ---- Group into sections by date header
  const sections = useMemo(() => {
    const map = new Map();
    for (const it of filtered) {
      const key = it.__dateLabel || 'UNKNOWN DATE';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    // Keep original order (already latest->oldest)
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  // ---- Renderers -----------------------------------------------------------

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.callItem}>
        <Avatar name={item.__name} size={50} style={{ marginRight: 10 }} />
        <View style={styles.callContent}>
          <View style={styles.callHeader}>
            <Text
              style={[
                styles.name,
                item.__type === 'missed' && styles.missedName
              ]}
              numberOfLines={1}
            >
              {item.__name}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Text style={styles.time}>{item.__time}</Text>
              <TouchableOpacity>
                <Image
                  source={require('../../../assets/info.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.callDetails}>
            <Image
              source={getCallIconSource(item.__type)}
              style={styles.callIcon}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.callType,
                item.__type === 'missed' && styles.missedText
              ]}
            >
              {getCallTypeText(item.__type)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <Text style={styles.dateHeader}>{section.title}</Text>
  );

  const ListFooter = () => (
    <View style={{ paddingVertical: 16 }}>
      {fetchingMore ? <ActivityIndicator /> : null}
    </View>
  );

  const dismissKeyboard = () => Keyboard.dismiss();

  // ---- UI ------------------------------------------------------------------

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

        {/* Header */}
        <ImageBackground
          source={require('../../../assets/header_bg.png')}
          style={styles.header}
          resizeMode="cover"
        >
          <Text style={styles.headerTitle}>Call Logs</Text>
        </ImageBackground>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle='solid' size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search names or numbers"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {['All calls', 'Missed', 'Incoming', 'Outgoing'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilter
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === filter && styles.activeFilterText
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List (grouped by date) */}
        {initialLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            ListFooterComponent={ListFooter}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    width: '100%',
    height: 130, 
    paddingTop: 80, 
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    gap: 8
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 80, // Space for bottom nav
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f9f9f9',
    textTransform: 'uppercase',
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  callContent: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  missedName: {
    color: '#FF3B30',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callIcon: {
    width: 16,
    height: 16,
  },
  callType: {
    fontSize: 14,
    color: '#666',
  },
  missedText: {
    color: '#FF3B30',
  },
  infoButton: {
    padding: 10,
  },
  infoIcon: {
    width: 18,
    height: 18,
  },
});

export default CallLogs;