import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Image,
  ScrollView, Keyboard, ImageBackground, TouchableWithoutFeedback, ActivityIndicator,
  FlatList, RefreshControl
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import Avatar from '../../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import useCall from '../../../hooks/useCall';


/* --------------------------- Formatting --------------------------- */
const dateLabel = (iso) => {
  try {
    const d = new Date(iso || '');
    const opts = { timeZone: 'Africa/Lagos', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Intl.DateTimeFormat('en-NG', opts).format(d).toUpperCase();
  } catch { return ''; }
};

const timeLabel = (iso) => {
  try {
    const d = new Date(iso || '');
    const opts = { timeZone: 'Africa/Lagos', hour: 'numeric', minute: '2-digit' };
    return new Intl.DateTimeFormat('en-NG', opts).format(d);
  } catch { return ''; }
};

const computeType = (item) => {
  const dir = (item.call_direction || '').toLowerCase();
  if (dir === 'inbound' && (item.duration === '00:00' || item.duration === '0:00')) return 'missed';
  if (dir === 'inbound') return 'incoming';
  return 'outgoing';
};

const displayName = (item) => {
  const cid = item.caller_id || '';
  const called = item.called_number || '';
  const dir = (item.call_direction || '').toLowerCase();
  if (dir === 'inbound') return cid.replace(/"/g, '') || called;
  return called || cid.replace(/"/g, '');
};

const getCallIconSource = (type) => {
  switch (type) {
    case 'missed': return require('../../../assets/missed.png');
    case 'incoming': return require('../../../assets/incoming.png');
    default: return require('../../../assets/outgoing.png');
  }
};

const getCallTypeText = (type) =>
  type === 'missed' ? 'Missed call' : type === 'incoming' ? 'Incoming call' : 'Outgoing call';

const buildNextUrl = (base, next) => (!next ? null : next.startsWith('?') ? `${base}${next}` : next);


/* -------------------------------- Component ------------------------------- */
const CallLogs = ({ navigation }) => {
  const { api } = useApi();
  const { handleApiError } = useError();
  const ENDPOINT = '/call-center/cdrs/pbx/';

  const [activeFilter, setActiveFilter] = useState('All calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiItems, setApiItems] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localLoaded, setLocalLoaded] = useState(false);

  const { callLogs, dial } = useCall();
  
  // Load local data - just store it as-is
  useEffect(() => {
    try {
      console.log("local calllogs are ", callLogs)
      const logs = Array.isArray(callLogs['_j']) ? callLogs['_j'] : [];

      console.log("local logs are ", logs)
      setLocalItems(logs);
      setLocalLoaded(true);
    } catch {
      setLocalItems([]);
      setLocalLoaded(true);
    }
  }, [callLogs]);

  // Fetch API page
  const fetchPage = useCallback(async (url) => {
    const res = await api.get(url);
    const { results = [], next = null } = res?.data || {};
    console.log("api logs are ", results)

    // Deduplicate by API id
    setApiItems((prev) => {
      const existingIds = new Set(prev.map(item => item.id).filter(Boolean));
      const newItems = results.filter(item => !existingIds.has(item.id));
      return [...prev, ...newItems];
    });
    
    setNextUrl(buildNextUrl(ENDPOINT, next));
  }, [ENDPOINT]);

  // First load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await fetchPage(`${ENDPOINT}`);
      } catch (e) {
        if (mounted) handleApiError(e);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ENDPOINT, fetchPage, handleApiError]);

  // Pagination
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

  // Refresh
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setApiItems([]);
      setNextUrl(null);
      await fetchPage(`${ENDPOINT}`);
    } catch (e) {
      handleApiError(e);
    } finally {
      setRefreshing(false);
    }
  }, [ENDPOINT, fetchPage, handleApiError]);

  /* ------------------------- Combine & Sort ------------------------ */
  
  const allItems = useMemo(() => {
    // Tag items with source
    const local = localItems.map((item) => ({ ...item, __source: 'local' }));
    const api = apiItems.map((item) => ({ ...item, __source: 'api' }));
    
    // Combine both arrays
    const combined = [...local, ...api];
    
    // Decorate and sort by timestamp
    return combined
      .map((item) => {
        const timestamp = new Date(item.call_start || item.created_at).getTime();
        return {
          ...item,
          __timestamp: timestamp,
          __type: computeType(item),
          __name: displayName(item),
          __time: timeLabel(item.call_start || item.created_at),
          __dateLabel: dateLabel(item.call_start || item.created_at),
          __stableKey: `${item.__source}-${item.id || item.call_start}`,
        };
      })
      .sort((a, b) => b.__timestamp - a.__timestamp);
  }, [localItems, apiItems]);


  /* ------------------------- Filter ------------------------ */
  const filteredData = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return allItems.filter((it) => {
      const matchesSearch =
        !q ||
        it.__name.toLowerCase().includes(q) ||
        (it.called_number || '').toLowerCase().includes(q) ||
        (it.caller_id || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (activeFilter === 'Missed')   return it.__type === 'missed';
      if (activeFilter === 'Incoming') return it.__type === 'incoming';
      if (activeFilter === 'Outgoing') return it.__type === 'outgoing';
      return true;
    });
  }, [allItems, activeFilter, searchQuery]);


  /* --------------------------------- Render ---------------------------------- */
  const renderItem = ({ item, index }) => {
    // Show date header when date changes
    const showDateHeader = index === 0 || filteredData[index - 1].__dateLabel !== item.__dateLabel;
    
    const getPhoneNumber = () => {
      const dir = (item.call_direction || '').toLowerCase();
      if (dir === 'outbound') {
        // For outgoing, dial the called number
        return item.called_number || '';
      } else {
        // For incoming/missed, extract number from caller_id or use called_number
        const cid = item.caller_id || '';
        
        // Try to extract number from "Name <number>" format
        const match = cid.match(/<([^>]+)>/);
        if (match) return match[1];

        // Otherwise use the raw caller_id or called_number
        return cid.replace(/"/g, '') || item.called_number || '';
      }
    };

    const handleCallPress = () => {
      const number = getPhoneNumber();
      if (number) {
        dial(number);
      }
    };

    return (
      <>
        {showDateHeader && (
          <Text style={styles.dateHeader}>{item.__dateLabel}</Text>
        )}
        <TouchableOpacity style={styles.callItem} onPress={handleCallPress}>
          <Avatar name={item.__name} size={50} style={{ marginRight: 10 }} />
          <View style={styles.callContent}>
            <View style={styles.callHeader}>
              <Text style={[styles.name, item.__type === 'missed' && styles.missedName]} numberOfLines={1}>
                {item.__name}
              </Text>
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
            </View>
          </View>
            </View>
            <View style={styles.callDetails}>
              <Image source={getCallIconSource(item.__type)} style={styles.callIcon} resizeMode="contain" />
              <Text style={[styles.callType, item.__type === 'missed' && styles.missedText]}>
                {getCallTypeText(item.__type)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  const ListFooter = () => (
    <View style={{ paddingVertical: 16 }}>
      {fetchingMore ? <ActivityIndicator /> : null}
    </View>
  );

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

        <ImageBackground source={require('../../../assets/header_bg.png')} style={styles.header} resizeMode="cover">
          <Text style={styles.headerTitle}>Call Logs</Text>
        </ImageBackground>

        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle="solid" size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search names or numbers"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {['All calls', 'Missed', 'Incoming', 'Outgoing'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, activeFilter === filter && styles.activeFilter]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterButtonText, activeFilter === filter && styles.activeFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {(!localLoaded && initialLoading) ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.__stableKey}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onEndReachedThreshold={0.5}
            onEndReached={loadMore}
            ListFooterComponent={ListFooter}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            removeClippedSubviews={false}
            windowSize={21}
            maxToRenderPerBatch={10}
            initialNumToRender={20}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { width: '100%', height: 130, paddingTop: 80, paddingBottom: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.heading3.fontSize, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, marginHorizontal: 20, marginVertical: 15, paddingHorizontal: 15, gap: 8 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: '#333' },
  filterContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterScrollContent: { paddingHorizontal: 20, alignItems: 'center' },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10 },
  activeFilter: { backgroundColor: colors.primary },
  filterButtonText: { fontSize: 14, color: '#666' },
  activeFilterText: { color: '#fff' },
  listContent: { paddingBottom: 80 },
  dateHeader: { fontSize: 14, fontWeight: '500', color: '#999', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#f9f9f9', textTransform: 'uppercase' },
  callItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  callContent: { flex: 1 },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, marginRight: 10 },
  missedName: { color: '#FF3B30' },
  callDetails: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callIcon: { width: 16, height: 16 },
  callType: { fontSize: 14, color: '#666' },
  missedText: { color: '#FF3B30' },
});

export default CallLogs;