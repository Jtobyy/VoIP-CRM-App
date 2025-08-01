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
  TouchableWithoutFeedback
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Avatar from '../../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';
import { formatChatTime } from '../../../utils/timeUtils';


const MessagesList = ({ navigation }) => {
  const [messagesData, setMessagesData] = useState([]);
  const { setLoading } = useLoading();
  const { api } = useApi();
  const [connectedChannels, setConnectedChannels] = useState([])
  const [allChannels, setAllChannels] = useState([]);
  const { handleApiError } = useError();


  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All messages');
  const [isEmpty, setIsEmpty] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const flatListRef = useRef(null);

  const filteredMessages = messagesData.filter((message) => {
    const matchesChannel =
      activeFilter === 'All messages' || message.channel.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/communication/contacts/?page=${1}&page_size=${15}`);
        console.log(response.data);
        setMessagesData(response.data.results);
        setIsEmpty(response.data.results.length === 0);
      } catch (error) {
        handleApiError(error); // Use your error handler here too
      } finally {
        setLoading(false);
      }
    };    
  
    fetchMessages();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [activeFilter]);

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
    // TODO: Implement plus press
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

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboardAndMenu}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />

        {/* Header */}
        <ImageBackground
          source={require('../../../assets/header_bg.png')}
          style={styles.header}
          resizeMode="cover"
        >
          <Text style={styles.headerTitle}>Messages</Text>
        </ImageBackground>

        {/* Search */}
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

        {/* Filter Menu */}
        {showFilterMenu && (
          <View style={styles.filterMenu}>
            {['All messages', 'Instagram', 'Facebook', 'Telegram'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterMenuItem,
                  activeFilter === item && styles.activeFilterMenuItem
                ]}
                onPress={() => {
                  setActiveFilter(item);
                  setShowFilterMenu(false);
                }}
              >
                <Text style={styles.filterMenuText}>{item}</Text>
                {activeFilter === item && (
                  <FontAwesome6
                    name="check"
                    size={16}
                    color={colors.primary}
                    style={styles.filterMenuIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Top Filters */}
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
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setActiveFilter('Unread');
                setShowFilterMenu(false);
              }}
            >
              <Text style={styles.filterButtonText}>Unread</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* List or Empty */}
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
            <TouchableOpacity style={[styles.fab, { bottom: 0 }]} onPress={handlePlusPress}>
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
          />
        )}

        {!isEmpty && (
          <TouchableOpacity style={styles.fab} onPress={handlePlusPress}>
            <Icon name="add" size={30} color="#fff" />
          </TouchableOpacity>
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
    paddingBottom: 80, // Space for bottom nav
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
    top: 180, // Adjust based on your header height
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