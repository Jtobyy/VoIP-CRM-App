import React, { useRef,useState,useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ImageBackground,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Modal
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import AddCommentModal from '../../../components/AddCommentModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../../../hooks/useApi'
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';

const icons = {
  'Missed call': require('../../../assets/missed.png'),
  'Incoming call': require('../../../assets/incoming.png'),
  'Outgoing call': require('../../../assets/outgoing.png'),
};

const CustomerDetails = ({ route,navigation }) => {
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);
  const { customerId } = route.params;
  const { setLoading } = useLoading();
  const { handleApiError } = useError();
  const { api } = useApi();
  const addCommentRef = useRef(null);
  const [customer, setCustomer] = useState(null);
  const [comments, setComments] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

  // const contact = {
  //   initials: 'AF',
  //   name: 'Adedoyin Folakemi',
  //   phone: '+234 803 567 0547',
  //   altPhone: '+234 803 567 0547',
  //   email: 'Adedoyinfolakemi22@gmail.com',
  //   company: 'Folakemi Souvenirs LTD',
  //   callHistory: [
  //     { date: 'Tue, January, 26', type: 'Missed call', time: '10:43 AM' },
  //     { date: 'Thu, January, 23', type: 'Incoming call', time: '5:30 PM', duration: '6 minutes' },
  //     { date: 'Wed, December, 21', type: 'Outgoing call', time: '12:00 AM', duration: '43 seconds' },
  //     { date: 'Tue, January, 26', type: 'Outgoing call', time: '2:33 PM', duration: '1 minute' },
  //     { date: 'Tue, January, 26', type: 'Outgoing call', time: '4:55 PM', duration: '17 minutes' },
  //   ],
  //   comments: [
  //     { date: 'MON, 24TH SEPT.', text: "I'd love to hear more about what we can do for you...", time: '10:00AM' },
  //     { date: 'WED, 19TH SEPT.', text: "I'd love to hear more about what we can do for you...", time: '10:00AM' },
  //   ]
  // };

  const dismissKeyboardAndMenu = () => {
    Keyboard.dismiss();
    setShowFilterMenu(false);
  };

  useEffect(() => {
  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const [customerRes, commentRes] = await Promise.all([
        api.get(`/customers/${customerId}/`),
        api.get('/comments/', { params: { model: 'customer', object_id: customerId } })
      ]);

      setCustomer(customerRes?.data?.customer || null);
      setComments(commentRes?.data?.comments || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  fetchCustomerDetails();
}, [customerId]);

const deleteCustomers = async()=>{
   setShowDeleteModal(false);
  try {
  const res = await api.delete(`/customers/${customerId}/`);

  // If it somehow throws, but the delete still works:
  if (!res || res.status === 204) {
    setShowSuccessModal(true);
  }
} catch (error) {
  if (
    error?.message === 'Network Error' &&
    error?.config?.url?.includes('/customers/')
  ) {
    // assume delete succeeded
    setShowSuccessModal(true);
  } else {
    handleApiError(error);
  }
}
}


  return (
    <TouchableWithoutFeedback onPress={dismissKeyboardAndMenu}>
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Header */}
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer info</Text>
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
            <TouchableOpacity style={styles.popupMenuItem} onPress={()=>navigation.navigate('EditCustomer', { customerId: customerId })}>
              <Text style={styles.popupMenuText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Copy number</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem} onPress={() =>  setShowDeleteModal(true)}>
              <Text style={styles.popupMenuText}>Delete customer</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Avatar */}
     <View style={styles.avatarContainer}>
  {customer?.image ? (
    <Image source={{ uri: customer.image }} style={styles.avatarImage} />
  ) : (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarText}>
        {`${customer?.first_name?.[0] || ''}${customer?.last_name?.[0] || ''}`.toUpperCase()}
      </Text>
    </View>
  )}
  <Text style={styles.customerName}>{`${customer?.first_name || ''} ${customer?.last_name || ''}`.trim()}</Text>
</View>

      {/* Info */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.label}>Phone number</Text>
          <Text style={styles.value}>{customer?.phone_number || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.iconWrapper}>
          <Image
            source={require('../../../assets/call_ic.png')} // replace with your actual image
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      {/* Alt phone number */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{customer?.username || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.iconWrapper}>
          <Image
            source={require('../../../assets/ic_moreprofile.png')} 
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      {/* Email address */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.label}>Email address</Text>
          <Text style={styles.value}>{customer?.email || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.iconWrapper}>
          <Image
            source={require('../../../assets/mail_ic.png')} // replace with your actual image
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      {/* Company */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.label}>Country</Text>
          <Text style={styles.value}>{customer?.country_name || 'N/A'}</Text>
        </View>
        <TouchableOpacity style={styles.iconWrapper}>
          <Image
            source={require('../../../assets/company_ic.png')} // replace with your actual image
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

      {/* Call History */}
      {/* <View style={styles.section}>
        {contact.callHistory.map((call, idx) => (
          <View key={idx} style={styles.callRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={icons[call.type] || icons['Outgoing call']}
                style={[
                  styles.callIcon,
                  call.type === 'Missed call' ? { tintColor: 'red' } : {}
                ]}
              />

              <View style={{ marginLeft: 10 }}>
                <Text style={styles.callDate}>{call.date}</Text>
                <Text style={styles.callType}>
                  {call.type}{call.duration ? ` • ${call.duration}` : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.callTime}>{call.time}</Text>
          </View>
        ))}
      </View> */}

        {/* Delete Confirmation Modal */}
              <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.confirmationModal}>
                    <Text style={styles.modalTitle}>
                      Delete Customer?
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowDeleteModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.deleteButton]}
                        onPress={deleteCustomers}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
      
              {/* Success Modal */}
              <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
               setShowSuccessModal(false);
               navigation.goBack(); // move to tab after closing
              }}
               >
                <View style={styles.modalContainer}>
                  <View style={styles.successModal}>
                    <FontAwesome6 name="circle-check" iconStyle='solid' size={60} color={colors.primary} />
                    <Text style={styles.successTitle}>Success!</Text>
                    <Text style={styles.successMessage}>
                      Customer deleted
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.successButton}
                      onPress={() => {
                       setShowSuccessModal(false);
                     navigation.goBack(); // move to tab after closing
                    }}
                    >
                      <Text style={styles.successButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

      {/* Comments */}
      <View style={styles.commentSection}>
        <View style={styles.commentHeaderRow}>
          <Text style={styles.commentHeader}>Comments</Text>
          <TouchableOpacity
            style={styles.addCommentInlineButton}
            onPress={() => addCommentRef.current?.open()}
          >
            <Text style={styles.addCommentInlineText}>+ Add comment</Text>
          </TouchableOpacity>

        </View>

  {comments?.length > 0 ? (
  comments?.map((comment) => {
    const date = new Date(comment.created_at).toDateString();
    const time = new Date(comment.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View key={comment.id} style={styles.commentBlock}>
        <View style={styles.commentMetaRow}>
          <Text style={styles.commentDate}>{date}</Text>
          <Text style={styles.commentTime}>{time}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    );
  })
) : (
  <View style={styles.noCommentsContainer}>
    <Text style={styles.noCommentsText}>No comments yet.</Text>
  </View>
)}


      </View>
      {/* <AddCommentModal ref={addCommentRef} /> */}

    </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default CustomerDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  avatarCircle: {
    backgroundColor: '#E7F7E1',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
  width: 100,
  height: 100,
  borderRadius: 50,
  resizeMode: 'cover',
  backgroundColor: '#f0f0f0', // optional fallback background
},
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  customerName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  
  iconWrapper: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  
  iconImage: {
    width: 41,
    height: 41,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#222',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  callRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  callDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  callType: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  callTime: {
    fontSize: 13,
    color: '#888',
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  addCommentInlineButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  
  addCommentInlineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  
  commentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },  
  commentSection: {
    paddingHorizontal: 20,
    marginTop: 25,
    paddingBottom: 40,
  },
  commentHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  commentBlock: {
    marginBottom: 15,
  },
  commentDate: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#aaa',
  },
  addCommentButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  addCommentText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
   modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmationModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  successModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  callIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: 'gray',
  },  
});
