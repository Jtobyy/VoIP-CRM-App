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
} from 'react-native';
import { colors } from '../../styles/global';
import Icon from 'react-native-vector-icons/MaterialIcons';

const messagesData = [
  {
    id: '1',
    name: 'Chioma Okere',
    time: 'Yesterday',
    preview: 'Hi Chichi! I\'d love to hear more about what...',
    unread: true,
  },
  {
    id: '2',
    name: 'Sade Adu',
    time: 'Yesterday',
    preview: 'Hi Chichi! I\'d love to hear more about what...',
    unread: false,
  },
  {
    id: '3',
    name: 'Viv Ubochi',
    time: 'Yesterday',
    preview: 'I\'m Vivian! My first investment...',
    unread: true,
  },
  {
    id: '4',
    name: 'Nia Long',
    time: 'Yesterday',
    preview: 'I\'m Nia! My first investment...',
    unread: false,
  },
  {
    id: '5',
    name: 'Max Payne',
    time: 'Yesterday',
    preview: 'I\'m Maxwell! My first investment...',
    unread: false,
  },
  {
    id: '6',
    name: 'Donald Chuks',
    time: 'Yesterday',
    preview: 'I\'m Don! My first investment...',
    unread: true,
  },
  {
    id: '7',
    name: 'John Wayne',
    time: 'Yesterday',
    preview: 'I\'m John! My first investment...',
    unread: false,
  },
];

const MessagesScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.messageItem}
      onPress={() => navigation.navigate('Chat', { contact: item })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map(name => name[0]).join('')}
        </Text>
      </View>
      
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
          {item.preview}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>All messages</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        data={messagesData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
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
});

export default MessagesScreen;