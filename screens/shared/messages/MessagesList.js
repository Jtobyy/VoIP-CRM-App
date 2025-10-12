import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Image,
  ScrollView,
  Keyboard,
  ImageBackground,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Avatar from '../../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import { formatChatTime } from '../../../utils/timeUtils';
import { useWebSocket } from '../../../hooks/useWebSocket';


const MessagesList = ({ navigation }) => {
  const [messagesData, setMessagesData] = useState([]);
  const { setLoading } = useLoading();
  const { api } = useApi();
  const [connectedChannels, setConnectedChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null); 
  const [allChannels, setAllChannels] = useState([]);
  const { handleApiError } = useError();

  const { addMessageListener } = useWebSocket();

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All messages');
  const [isEmpty, setIsEmpty] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const flatListRef = useRef(null);

  const filteredMessages = messagesData.filter((message) => {
    const matchesSearch =
      message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.lastMessageData.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });  

  const [nextUrl, setNextUrl] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onEndReachedCalledDuringMomentum = useRef(false);

  useEffect(() => {
   fetchMessages({ reset: true  });
  }, [selectedChannel]);


  useEffect(() => {
    const unsubscribe = addMessageListener((data) => {
      if (data?.type === 'message' && data.message) {
        const message = data.message;
        const contactId = message.lead_sender || message.lead_receiver;

        const newLead = message.lead_sender_details || message.lead_receiver_details;
        const fallbackName = newLead?.name || newLead?.lead_name || newLead?.first_name || newLead?.email || "Unknown";

        setMessagesData((prevMessages) => {
          const index = prevMessages.findIndex((m) => m.id === contactId);

          if (index !== -1) {
            // update existing chat
            const updated = [...prevMessages];
            const updatedItem = {
              ...updated[index],
              lastMessageData: message,
              last_message_at: message.created_at,
              unread: true,
              unreadCount: (updated[index].unreadCount || 0) + 1,
            };

            // remove from old position
            updated.splice(index, 1); 
            return [updatedItem, ...updated]; 
          } else {
            // insert new chat
            const newItem = {
              id: contactId,
              name: fallbackName,
              image: newLead?.image || null,
              channel: newLead?.channel || null,
              lastMessageData: message,
              last_message_at: message.created_at,
              unread: true,
              unreadCount: 1,
            };
            console.log('Inserting new chat item:',newItem)

            return [newItem, ...prevMessages];
          }
        });
      }
    });

    return unsubscribe;
  }, [addMessageListener]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchChannelsData();
  }, []);

  const buildFirstPageEndpoint = () => {
    let endpoint = `/communication/contacts/?page=1&page_size=15`;
    if (selectedChannel?.id) endpoint += `&channel_id=${selectedChannel.id}`;
    return endpoint;
  };

  const mergeUniqueById = (prev, incoming) => {
    const map = new Map();
    prev.forEach((it) => map.set(it.id, it));
    incoming.forEach((it) => {
      const existing = map.get(it.id);
      // prefer the newer last_message_at / newer fields if present
      if (!existing) {
        map.set(it.id, it);
      } else {
        const newer =
          (it.last_message_at && existing.last_message_at &&
            new Date(it.last_message_at) > new Date(existing.last_message_at)) ? it : existing;
        map.set(it.id, { ...existing, ...newer });
      }
    });
    return Array.from(map.values());
  };

  const fetchMessages = async ({ reset = false } = {}) => {
    const endpoint = buildFirstPageEndpoint();
    if (reset) {
      setLoading(true);
      setNextUrl(null);
    }
    try {
      const res = await api.get(endpoint);
      const { results = [], next = null } = res.data || {};
      setMessagesData(results);
      setIsEmpty(results.length === 0);
      setNextUrl(next);
    } catch (error) {
      handleApiError(error);
    } finally {
      if (reset) setLoading(false);
    }
  };

  const fetchNextPage = async () => {
    if (!nextUrl || isFetchingMore) return;
    if (searchTerm.trim()) return;

    setIsFetchingMore(true);
    try {
      const res = await api.get(nextUrl);
      const { results = [], next = null } = res.data || {};
      setMessagesData((prev) => mergeUniqueById(prev, results));
      setNextUrl(next);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMessages({ reset: true });
    } finally {
      setRefreshing(false);
    }
  };
  const fetchChannelsData = async () => {
		try {
		  const allChannelsResponse = await api.get("/channels/all/");
		  setAllChannels(allChannelsResponse.data.channels);
	
		  const connectedChannelsResponse = await api.get("/channels/connected-channels/");
		  setConnectedChannels(connectedChannelsResponse.data.connected_channels);
		}
		catch (error) {
			if (isCancelError(error)) {
				console.log('cr');
			} else {
				handleApiError(error);
			}
		}
	};

  const handlePlusPress = () => {
    navigation.navigate('ConnectChannels')
  };

  const dismissKeyboardAndMenu = () => {
    Keyboard.dismiss();
    setShowFilterMenu(false);
  };

  const renderItem = ({ item }) => {
    const name = item?.name || item?.lead_name || item?.lead?.name || item?.customer_name || item?.customer.first_name || item?.customer.username || item?.customer.email || "Unknown "

    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => navigation.navigate('ConversationScreen', { contactId: item.id, contact: item })}
      >
        <Avatar
          name={name}
          size={50}
          style={{ marginRight: 10 }}
          image={item?.image}
          badge={item?.channel?.image}
        />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={[styles.name, item.unread && styles.unreadName]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.time}>{formatChatTime(item?.lastMessageTime || item?.last_message_at)}</Text>
          </View>
          <Text style={[styles.preview, item.unread && styles.unreadPreview]} numberOfLines={1}>
            {item.lastMessageData?.content}
          </Text>
        </View>
      </TouchableOpacity>
    )};

  const ListFooter = () => {
    if (isFetchingMore) {
      return (
        <View style={{ paddingVertical: 16 }}>
          <ActivityIndicator />
        </View>
      );
    }
    if (!nextUrl && messagesData.length > 0) {
      return (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: '#777' }}>No more messages</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboardAndMenu}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

        <ImageBackground
          source={require('../../../assets/header_bg.png')}
          style={styles.header}
          resizeMode="cover"
        >
          <Text style={styles.headerTitle}>Messages</Text>
        </ImageBackground>

        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle='solid' size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <TouchableOpacity onPress={() => setShowFilterMenu(!showFilterMenu)}>
            <Image
              source={require('../../../assets/filter.png')}
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {showFilterMenu ? (
          <View style={styles.filterMenu}>
            <TouchableOpacity
              style={[
                styles.filterMenuItem,
                selectedChannel === null && styles.activeFilterMenuItem
              ]}
              onPress={() => {
                setSelectedChannel(null);
                setShowFilterMenu(false);
              }}>
              <Text style={styles.filterMenuText}>All Channels</Text>
              {selectedChannel === null ? (
                <FontAwesome6 name="check" size={16} iconStyle='solid' color={colors.primary} style={styles.filterMenuIcon} />
              ) : null}
            </TouchableOpacity>

            {connectedChannels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.filterMenuItem,
                  selectedChannel?.id === channel.id && styles.activeFilterMenuItem
                ]}
                onPress={() => {
                  setSelectedChannel(channel);
                  setShowFilterMenu(false);
                }}>
                <Text style={styles.filterMenuText}>{channel.name}</Text>
                {selectedChannel?.id === channel.id ? (
                  <FontAwesome6 name="check" size={16} iconStyle='solid' color={colors.primary} style={styles.filterMenuIcon} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[styles.filterButton, styles.activeFilter]}
              onPress={() => {
                setActiveFilter('All messages');
                setShowFilterMenu(false);
              }}
            >
              <Text style={[styles.filterButtonText, styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {isEmpty ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
            <Image
              source={require('../../../assets/empty.png')}
              style={{ width: 180, height: 180, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: 15 }}>
              You do not have any messages
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, color: '#444' }}>Tap on the</Text>
              <View style={{ marginHorizontal: 6 }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, lineHeight: 16 }}>+</Text>
                </View>
              </View>
              <Text style={{ fontSize: 15, color: '#444' }}>icon to get started</Text>
            </View>
            <TouchableOpacity style={[styles.fab, { bottom: 25 }]} onPress={handlePlusPress}>
              <Icon name="add" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredMessages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
                 refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReachedThreshold={0.5}
            onMomentumScrollBegin={() => {
              onEndReachedCalledDuringMomentum.current = false;
            }}
            onEndReached={() => {
              if (!onEndReachedCalledDuringMomentum.current) {
                onEndReachedCalledDuringMomentum.current = true;
                fetchNextPage();
              }
            }}
            ListFooterComponent={<ListFooter />}
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
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  Container: {
    paddingHorizontal: 20,
    marginBottom: 10,
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
    paddingBottom: 80,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  unreadName: {
    color: '#333',
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  preview: {
    fontSize: 14,
    color: '#999',
  },
  unreadPreview: {
    color: '#333',
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  activeNavText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  filterMenu: {
    position: 'absolute',
    top: 180,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
    width: 180,
  },
  filterMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterMenuText: {
    fontSize: 16,
    color: '#333',
  },
  activeFilterMenuItem: {
    backgroundColor: '#f5f5f5',
  },
  filterMenuIcon: {
    position: 'absolute',
    right: 16,
    top: 14
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10, 
  }
  
});

export default MessagesList;