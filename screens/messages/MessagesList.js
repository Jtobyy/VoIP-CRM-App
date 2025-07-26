import React from 'react';
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
import { colors, typography } from '../../styles/global';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Avatar from '../../components/Avatar';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const messagesData = [
  { 
    id: '1',
    name: 'Chioma Okere',
    channel: 'telegram',
    channel_icon: require('../../assets/telegram.png'),
    text: 'Hi Chichi! I\'d love to hear more about what...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample2.png'),
    unread: true,
  },
  {
    id: '2',
    name: 'Sade Adu',
    channel: 'instagram',
    channel_icon: require('../../assets/instagram.png'),
    text: 'Hi Chichi! I\'d love to hear more about what...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample1.png'),
    unread: false,
  },
  {
    id: '3',
    name: 'Viv Ubochi',
    channel: 'facebook',
    channel_icon: require('../../assets/facebook.png'),
    text: 'I\'m Vivian! My first investment...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample3.png'),
    unread: true,
  },
  {
    id: '4',
    name: 'Nia Long',
    channel: 'telegram',
    channel_icon: require('../../assets/telegram.png'),
    text: 'I\'m Nia! My first investment...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample3.png'),
    unread: false,
  },
  {
    id: '5',
    name: 'Max Payne',
    channel: 'facebook',
    channel_icon: require('../../assets/facebook.png'),
    text: 'I\'m Maxwell! My first investment...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample2.png'),
    unread: false,
  },
  {
    id: '6',
    name: 'Donald Chuks',
    channel: 'instagram',
    channel_icon: require('../../assets/instagram.png'),
    text: 'I\'m Don! My first investment...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample1.png'),
    unread: true,
  },
  {
    id: '7',
    name: 'John Wayne',
    channel: 'telegram',
    channel_icon: require('../../assets/telegram.png'),
    text: 'I\'m John! My first investment...',
    time: 'Yesterday',
    profile_pic: require('../../assets/sample2.png'),
    unread: false,
  }
];

const MessagesList = ({ navigation }) => {
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState('All messages');
  const [isEmpty, setIsEmpty] = React.useState(true);
  const [hasActivatedOnce, setHasActivatedOnce] = React.useState(false);


  const filteredMessages = messagesData.filter(message => {
    if (activeFilter === 'All messages') return true;

    return message.channel === channelName;
  });

  const handlePlusPress = () => {
    if (isEmpty && !hasActivatedOnce) {
      setIsEmpty(false); // Show dummy messages
      setHasActivatedOnce(true);
    } else {
      navigation.navigate('ConnectChannels');
    }
  };

  const dismissKeyboardAndMenu = () => {
    Keyboard.dismiss();
    setShowFilterMenu(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => navigation.navigate('ConversationScreen', { conversationId: item.id })}
    >
      <Avatar 
        name={item.name} 
        size={50} 
        style={{ marginRight: 10 }}
        image={item?.profile_pic}
        badge={item?.channel_icon}
      />
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text 
            style={[styles.name, item.unread && styles.unreadName]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        
        <Text 
          style={[styles.preview, item.unread && styles.unreadPreview]}
          numberOfLines={1}
        >
          {item.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboardAndMenu}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        
        {/* Header */}
        <ImageBackground 
          source={require('../../assets/header_bg.png')}
          style={styles.header}
          resizeMode="cover"
        >
          <Text style={styles.headerTitle}>Messages</Text>
        </ImageBackground>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle='solid' size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setShowFilterMenu(!showFilterMenu)}>
            <Image 
              source={require('../../assets/filter.png')} 
              style={{width: 30, height: 30}}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Filter Menu */}
        {showFilterMenu && (
          <View style={styles.filterMenu}>
            {['All messages', 'Instagram', 'Facebook', 'WhatsApp', 'SMS', 'Livechat'].map((item) => (
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
                    iconStyle='solid'
                    style={styles.filterMenuIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
              <Text style={[styles.filterButtonText, styles.activeFilterText]}>Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>Customers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>Closed Conversations</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Messages List */}
        {isEmpty ? (
          <View style={{ flex: 1, position: 'relative', top: '-30', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
            <Image
              source={require('../../assets/empty.png')} // your empty state image
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


            <TouchableOpacity
              style={[styles.fab, {bottom: 0}]}
              onPress={handlePlusPress}
            >
              <Icon name="add" size={30} color="#fff" />
            </TouchableOpacity>

          </View>
        ) : (
          <FlatList
            data={filteredMessages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!isEmpty && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handlePlusPress}
          >
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