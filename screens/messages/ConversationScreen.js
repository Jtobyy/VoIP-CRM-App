import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, Image, ImageBackground, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../styles/global';
import Avatar from '../../components/Avatar';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import DocumentPicker from 'react-native-document-picker';


const demoMessages = [
  { id: '1', type: 'incoming', text: 'Hello Chichi! consectetur adipiscing elit...', time: '09:45 AM' },
  { id: '2', type: 'outgoing', text: 'Hello January! Of course.', time: '07:00 PM' },
  { id: '3', type: 'incoming', text: 'Fames eros urna, felis morbi a est est.', time: '09:00 AM' },
];

const contact = {
  name: 'January Jones',
  avatar: require('../../assets/sample1.png'), // or remote URL
  channel_icon: require('../../assets/telegram.png'),
};

const ConversationScreen = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle();
      console.log('Selected file:', res);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        throw err;
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isOutgoing = item.type === 'outgoing';
  
    return (
      <View style={{ marginBottom: 12, alignItems: isOutgoing ? 'flex-end' : 'flex-start' }}>
        <View style={[
          styles.messageBubble,
          isOutgoing ? styles.outgoing : styles.incoming
        ]}>
          <Text style={[
            styles.messageText,
            isOutgoing && styles.outgoingText
          ]}>
            {item.text}
          </Text>
        </View>
  
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    );
  };  

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowFilterMenu(false);
    }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80} // Adjust based on header height
    >
      {/* Header */}
      <ImageBackground 
        source={require('../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../assets/backWhite.png')} 
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.contactRow}>
          <Avatar 
            name={contact.name}
            size={40}
            image={contact.avatar}
            badge={contact.channel_icon}
            style={{ marginRight: 12 }}
          />
          <Text style={styles.headerTitle}>{contact.name}</Text>
        </View>

        <TouchableOpacity onPress={() => setShowFilterMenu(!showFilterMenu)}>
          <FontAwesome6 
            name="ellipsis-vertical" 
            iconStyle='solid' 
            size={24} 
            color={colors.white} 
            style={{ marginRight: 10}}
          />
        </TouchableOpacity>
      </ImageBackground>

      {showFilterMenu && (
        <View style={styles.popupMenu}>
          <TouchableOpacity style={styles.popupMenuItem} onPress={() => {navigation.navigate('AddCustomer');}}>
            <Text style={styles.popupMenuText}>Add as customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupMenuItem} onPress={() => {}}>
            <Text style={styles.popupMenuText}>Archived messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupMenuItem} onPress={() => {}}>
            <Text style={styles.popupMenuText}>Create a ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupMenuItem} onPress={() => {}}>
            <Text style={styles.popupMenuText}>Assign to agent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupMenuItem} onPress={() => {}}>
            <Text style={styles.popupMenuText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupMenuItem} onPress={() => {}}>
            <Text style={styles.popupMenuText}>End session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Message List */}
      <FlatList
        data={demoMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachButton} onPress={pickFile}>
          <Icon name="attach-file" size={22} color="black" />
        </TouchableOpacity>

        <TextInput
          placeholder="Type a message..."
          style={styles.textInput}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.sendButton}>
          <Icon name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  backButton: {
    padding: 5,
  },
  backButtonIcon: {
    width: 20,
    height: 20
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
  },
  incoming: {
    alignSelf: 'flex-start',
    backgroundColor: '#f2f2f2',
  },
  outgoing: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  messageText: {
    color: '#000',
    fontSize: 15,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  outgoingText: {
    color: '#fff',
  },
  
  popupMenu: {
    position: 'absolute',
    top: 130, // adjust to position under the header
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
  popupMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  popupMenuText: {
    fontSize: 16,
    color: '#333',
  },
  attachButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
});

export default ConversationScreen;
