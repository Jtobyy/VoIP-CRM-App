import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import { colors } from '../../styles/global';

const CustomerInfo = ({ navigation }) => {
  // Sample contact data - replace with your actual data
  const contact = {
    initials: 'AF',
    name: 'Adedoyin Folakemi',
    phone: '+234 803 567 0547',
    altPhone: '+234 803 567 0547',
    email: 'Adedoyinfolakemi22@gmail.com',
    company: 'Folakemi Souvenirs LTD',
    callHistory: [
      { date: 'Tue, January, 26', type: 'Missed call', time: '10:43 AM', duration: '' },
      { date: 'Thu, January, 23', type: 'Incoming call', time: '5:30 PM', duration: '', receivedBy: 'RECEIVED BY CHIOMA' },
      { date: 'Wed, December, 21', type: 'Outgoing call', time: '12:00 AM', duration: '43 seconds', receivedBy: 'RECEIVED BY CHIOMA' },
      { date: 'Tue, January, 26', type: 'Outgoing call', time: '2:33 PM', duration: '1 minute' },
      { date: 'Tue, January, 26', type: 'Outgoing call', time: '4:55 PM', duration: '17 minutes' },
    ],
    comments: [
      { date: 'MON, 24TH SEPT.', text: "I'd love to hear more about what we can do for you...", time: '10:00AM', author: 'Chioma' },
      { date: 'MON, 24TH SEPT.', text: "I'd love to hear more about what we can do for you...", time: '5:00PM', author: 'Chioma' },
      { date: 'WED, 19TH SEPT.', text: "I'd love to hear more about what we can do for you...", time: '10:00AM', author: 'Chioma' },
    ]
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact info</Text>
        <View style={{ width: 30 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact Header */}
        <View style={styles.contactHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{contact.initials}</Text>
          </View>
          <Text style={styles.contactName}>{contact.name}</Text>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone number</Text>
          <Text style={styles.detailText}>{contact.phone}</Text>
          
          <Text style={styles.sectionTitle}>Alternative phone number</Text>
          <Text style={styles.detailText}>{contact.altPhone}</Text>
          
          <Text style={styles.sectionTitle}>Email address</Text>
          <Text style={styles.detailText}>{contact.email}</Text>
          
          <Text style={styles.sectionTitle}>Company</Text>
          <Text style={styles.detailText}>{contact.company}</Text>
        </View>

        {/* Call History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call History</Text>
          {contact.callHistory.map((call, index) => (
            <View key={index} style={styles.callItem}>
              <View style={styles.callLeft}>
                <Text style={styles.callDate}>{call.date}</Text>
                <Text style={styles.callType}>
                  {call.type} {call.duration && `• ${call.duration}`}
                </Text>
                {call.receivedBy && <Text style={styles.receivedBy}>{call.receivedBy}</Text>}
              </View>
              <Text style={styles.callTime}>{call.time}</Text>
            </View>
          ))}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>
          {contact.comments.map((comment, index) => (
            <View key={index}>
              {(index === 0 || contact.comments[index-1].date !== comment.date) && (
                <Text style={styles.commentDate}>{comment.date}</Text>
              )}
              <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentTime}>{comment.time}</Text>
              </View>
            </View>
          ))}
          
          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add comment"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 30,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingBottom: 20,
  },
  contactHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  callItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  callLeft: {
    flex: 1,
  },
  callDate: {
    fontSize: 14,
    color: '#666',
  },
  callType: {
    fontSize: 14,
    color: '#333',
    marginTop: 3,
  },
  receivedBy: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  callTime: {
    fontSize: 14,
    color: '#666',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    marginBottom: 5,
  },
  commentBubble: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    paddingLeft: 15,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CustomerInfo;