// screens/ConversationScreen.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import Avatar from '../../../components/Avatar';
import { colors } from '../../../styles/global';
import useChat from '../../../hooks/useChat';
import { getSmartTimestamp } from '../../../utils/timeUtils';

const ConversationScreen = ({ route, navigation }) => {
  const { contactId, contact } = route.params;
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const flatListRef = useRef(null);

  const {
    messages,
    text,
    setText,
    pickFile,
    sendMessage,
    loading,
  } = useChat(contactId);

  // Ensure FlatList scrolls to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && layoutReady) {
      // Small delay to ensure the FlatList has rendered the new content
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length, layoutReady]);

  const renderMessage = ({ item }) => {
    const isOutgoing = item.company_is_sender
    return (
      <View style={{ alignItems: isOutgoing ? 'flex-end' : 'flex-start' }}>
        <View style={[styles.messageBubble, isOutgoing ? styles.outgoing : styles.incoming]}>
          <Text style={[styles.messageText, isOutgoing && styles.outgoingText]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.messageTime}>{item.created_at ? getSmartTimestamp(item.created_at) : ''}</Text>
      </View>
    );
  };

  const handleSendMessage = () => {
    sendMessage();
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  return (
    <View style={styles.container} onPress={() => {
      Keyboard.dismiss();
      setShowFilterMenu(false);
    }}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <ImageBackground source={require('../../../assets/header_bg.png')} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.contactRow}>
            <Avatar
              name = {contact?.name || contact?.lead_name || contact?.lead?.name || contact?.customer_name || contact?.customer.first_name || contact?.customer.username || contact?.customer.email || "Unknown "}
              size={40}
              image={contact?.image}
              badge={contact?.channel?.image}
            />
            <Text 
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
              >{contact?.name || contact?.lead_name || contact?.lead?.name || contact?.customer_name || contact?.customer.first_name || contact?.customer.username || contact?.customer.email || "Unknown "}</Text>
          </View>

          <TouchableOpacity onPress={() => setShowFilterMenu(!showFilterMenu)}>
            <FontAwesome6 name="ellipsis-vertical" iconStyle='solid' size={24} color={colors.white} />
          </TouchableOpacity>
        </ImageBackground>

        {showFilterMenu && (
          <View style={styles.popupMenu}>
            <TouchableOpacity style={styles.popupMenuItem} onPress={() => navigation.navigate('AddCustomer')}>
              <Text style={styles.popupMenuText}>Add as customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Archived messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Create a ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Assign to agent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>End session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message List */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            inverted
            data={messages}
            keyExtractor={(item, index) => `${item.id || index}`}
            renderItem={renderMessage}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            contentContainerStyle={styles.flatListContent}
            style={styles.flatList}
            removeClippedSubviews={false}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
            onLayout={() => setLayoutReady(true)}
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceVertical={true}
          />
        </View>

        {/* Input Row */}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton} onPress={pickFile}>
            <Icon name="attach-file" size={22} color="#000" />
          </TouchableOpacity>
          <TextInput
            placeholder="Type a message..."
            style={styles.textInput}
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 7,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 10,
    flexShrink: 1,
    maxWidth: '80%',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  messagesContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    marginVertical: 7,
  },
  incoming: { backgroundColor: '#f2f2f2' },
  outgoing: { backgroundColor: colors.primary },
  messageText: { fontSize: 15, color: '#000' },
  outgoingText: { color: '#fff' },
  messageTime: { fontSize: 12, color: '#666' },
  inputRow: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 45,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 12,
    marginLeft: 8,
  },
  attachButton: { paddingRight: 8 },
  popupMenu: {
    position: 'absolute',
    top: 130,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    paddingVertical: 8,
    width: 180,
    zIndex: 1000,
    elevation: 10,
  },
  popupMenuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  popupMenuText: { fontSize: 16, color: '#333' },
});

export default ConversationScreen;