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
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import Avatar from '../../../components/Avatar';
import { colors } from '../../../styles/global';
import useChat from '../../../hooks/useChat';
import { getSmartTimestamp } from '../../../utils/timeUtils';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import SpinningIcon from '../../../components/SpiningIcon';
import { useApi } from '../../../hooks/useApi';


const ConversationScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const contactId = params.contactId;
  const seedContact = params.contact || null;
  const conversationId = params.conversationId;

  const [contact, setContact] = useState(seedContact);
  const [contactLoading, setContactLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  
  const flatListRef = useRef(null);
  const didInitialScrollRef = useRef(false);
  const prevTopIdRef = useRef(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const {api} = useApi();


  const {
    messages,
    text,
    setText,
    pickFile,
    sendMessage,
    loading,
    pickedFile,
    setPickedFile,
    loadingMore,
    loadMore,
  } = useChat(contactId);

  // Fetch contact details if incomplete
  useEffect(() => {
    const fetchContactIfNeeded = async () => {
      if (!contactId) return;

      // Check if we have essential info already
      const hasEssentialInfo = contact?.name && contact?.image;
      if (hasEssentialInfo) return;

      setContactLoading(true);
      try {
        // Try fetching as a lead first
        try {
          const res = await api.get(`/customers/leads/${contactId}/`);
          const leadData = res?.data.lead;

          setContact((prev) => ({
            ...prev,
            id: contactId,
            name:
              leadData?.name ||
              leadData?.first_name ||
              leadData?.unique_identifier ||
              prev?.name ||
              'Unknown',
            image: leadData?.profileImage || leadData?.image || prev?.image,
            channel: prev?.channel || leadData?.channel,
          }));
          return;
        } catch (leadErr) {
          // If not a lead, try as customer
          const res = await api.get(`/customers/${contactId}/`);

          const customerData = res?.data;
          setContact((prev) => ({
            ...prev,
            id: contactId,
            name:
              customerData?.first_name ||
              customerData?.username ||
              customerData?.email ||
              prev?.name ||
              'Unknown',
            image: customerData?.profileImage || customerData?.image || prev?.image,
            channel: prev?.channel || customerData?.channel,
          }));
        }
      } catch (err) {
        console.error('[ConversationScreen] Error fetching contact:', err?.message);
        // Fallback: use what we have
        if (!contact?.name) {
          setContact((prev) => ({
            ...prev,
            id: contactId,
            name: 'Unknown',
          }));
        }
      } finally {
        setContactLoading(false);
      }
    };

    fetchContactIfNeeded();
  }, [contactId, contact?.name]);

  // Derive contact from first message if still missing
  useEffect(() => {
    if (contact?.name || !messages?.length) return;

    const m =
      messages.find(
        (msg) =>
          msg?.lead_receiver_details?.id === contactId ||
          msg?.lead_sender_details?.id === contactId ||
          msg?.customer_receiver_details?.id === contactId ||
          msg?.customer_sender_details?.id === contactId
      ) || messages[0];

    if (m) {
      const details =
        m?.lead_receiver_details ||
        m?.lead_sender_details ||
        m?.customer_receiver_details ||
        m?.customer_sender_details ||
        {};

      setContact((prev) => ({
        ...prev,
        id: contactId,
        name:
          details?.name ||
          details?.first_name ||
          details?.unique_identifier ||
          prev?.name ||
          'Unknown',
        image: details?.profileImage || details?.image || prev?.image || null,
        channel: prev?.channel || m?.channel || details?.channel || null,
        lastMessageData: { content: m?.content || '' },
        last_message_at: m?.created_at,
      }));
    }
  }, [messages, contactId, contact?.name]);

  // Initial scroll
  useEffect(() => {
    if (!didInitialScrollRef.current && layoutReady && messages.length > 0) {
      didInitialScrollRef.current = true;
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [layoutReady, messages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!layoutReady || !messages?.length) return;
    const topId = messages[0]?.id ?? null;

    if (prevTopIdRef.current === null) {
      prevTopIdRef.current = topId;
      return;
    }

    if (topId && topId !== prevTopIdRef.current) {
      prevTopIdRef.current = topId;
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    } else {
      prevTopIdRef.current = topId;
    }
  }, [messages, layoutReady]);

  const downloadFile = async (fileUrl, fileName) => {
    try {
      setDownloadingFileId(fileUrl);

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download the file',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required.');
          return;
        }
      }

      const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const ret = RNFS.downloadFile({ fromUrl: fileUrl, toFile: downloadDest });
      const result = await ret.promise;

      if (result.statusCode === 200) {
        Alert.alert('Download complete', `Saved to ${downloadDest}`);
        FileViewer.open(downloadDest, { showOpenWithDialog: true });
      } else {
        throw new Error('Download failed with status code ' + result.statusCode);
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Download failed', err.message || 'Something went wrong.');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const renderMessage = ({ item }) => {
    const isOutgoing = item.company_is_sender;
    return (
      <View style={{ alignItems: isOutgoing ? 'flex-end' : 'flex-start' }}>
        <View
          style={[
            styles.messageBubble,
            isOutgoing ? styles.outgoing : styles.incoming,
          ]}
        >
          {item.content_type === 'image' && item.document ? (
            <Image
              source={{ uri: item.document }}
              style={styles.messageImage}
            />
          ) : item.content_type === 'document' && item.attachments?.length > 0 ? (
            <TouchableOpacity
              style={styles.documentRow}
              onPress={() =>
                downloadFile(
                  item.attachments?.[0]?.file,
                  item.attachments?.[0]?.file_name
                )
              }
              disabled={downloadingFileId === item.attachments?.[0]?.file}
            >
              <View style={styles.documentRowContent}>
                <Text numberOfLines={1} style={styles.fileLink}>
                  {item.attachments?.[0]?.file_name || 'Document'}
                </Text>
                {downloadingFileId === item.attachments?.[0]?.file ? (
                  <View style={{ marginLeft: 8 }}>
                    <SpinningIcon />
                  </View>
                ) : (
                  <FontAwesome6
                    name="download"
                    size={16}
                    color="#007bff"
                    iconStyle="solid"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Text
            style={[
              styles.messageText,
              isOutgoing && styles.outgoingText,
            ]}
          >
            {item.content}
          </Text>
        </View>

        <Text style={styles.messageTime}>
          {item.created_at ? getSmartTimestamp(item.created_at) : ''}
        </Text>
      </View>
    );
  };

  const handleSendMessage = () => {
    sendMessage();
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  const contactName =
    contact?.name ||
    contact?.lead_name ||
    contact?.lead?.name ||
    contact?.customer_name ||
    contact?.customer?.first_name ||
    contact?.customer?.username ||
    contact?.customer?.email ||
    'Unknown';

  return (
    <View
      style={styles.container}
      onPress={() => {
        Keyboard.dismiss();
        setShowFilterMenu(false);
      }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <ImageBackground
          source={require('../../../assets/header_bg.png')}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.contactRow}>
            <Avatar
              name={contactName}
              size={40}
              image={contact?.image}
              badge={contact?.channel?.image}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={styles.headerTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {contactName}
              </Text>
              {contactLoading && (
                <Text style={styles.loadingText}>Loading...</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <FontAwesome6
              name="ellipsis-vertical"
              iconStyle="solid"
              size={24}
              padding={5}
              color={colors.white}
            />
          </TouchableOpacity>
        </ImageBackground>

        {showFilterMenu && (
          <View style={styles.popupMenu}>
            <TouchableOpacity
              style={styles.popupMenuItem}
              onPress={() =>
                navigation.navigate('AddCustomer', {
                  isFromLead: true,
                  leadId: contact?.id,
                })
              }
            >
              <Text style={styles.popupMenuText}>Add as customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message List */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            inverted
            data={messages}
            keyExtractor={(item, index) =>
              `${item.id || item._id || `temp-${index}`}`
            }
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
            onEndReached={loadMore}
            onEndReachedThreshold={0.15}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        </View>

        {pickedFile && (
          <View style={styles.pickedFilePreview}>
            <Text style={styles.fileName}>{pickedFile.name}</Text>
            <TouchableOpacity onPress={() => setPickedFile(null)}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}

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
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  loadingText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  messagesContainer: { flex: 1 },
  flatList: { flex: 1 },
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
  },
  popupMenuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  popupMenuText: { fontSize: 16, color: '#333' },
  pickedFilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: -8,
    marginHorizontal: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  messageImage: {
    width: 180,
    height: 180,
    borderRadius: 10,
  },
  fileLink: {
    fontSize: 15,
    color: '#007bff',
    textDecorationLine: 'underline',
    paddingVertical: 6,
  },
  documentRow: {
    maxWidth: 250,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 6,
    marginBottom: 6,
  },
  documentRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default ConversationScreen;