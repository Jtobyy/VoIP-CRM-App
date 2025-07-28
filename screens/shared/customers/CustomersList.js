import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  TextInput,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  ImageBackground,
  Keyboard,
  Image
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Avatar from '../../../components/Avatar';

// Sample data - replace with your actual data source
const initialCustomersData = [
  {
    title: 'A',
    data: [
      { id: 'AF', name: 'Adedoyin Folakemi', initials: 'AF' },
      { id: 'AC', name: 'Adetayo Cassandra', initials: 'AC' },
      { id: 'AL', name: 'Adriana La Cerva', initials: 'AL' },
      { id: 'AS', name: 'Alidae Shimana', initials: 'AS' },
      { id: 'AN', name: 'Amaka new customer', initials: 'AN' },
    ],
  },
  {
    title: 'C',
    data: [
      { id: 'CF', name: 'Cassandra Fakoya', initials: 'CF' },
      { id: 'CL', name: 'Customer Lekki 1', initials: 'CL' },
    ],
  },
  {
    title: 'E',
    data: [
      { id: 'ED', name: 'Eniola Daniels', initials: 'ED' },
      { id: 'EM', name: 'Ez Moreno Papi Ioko', initials: 'EM' },
    ],
  },
];

const CustomersList = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customersData, setCustomersData] = useState(initialCustomersData);
  const [filteredData, setFilteredData] = useState(initialCustomersData);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedCustomers([]);
    }
  };

  // Handle customer selection
  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId) 
        : [...prev, customerId]
    );
  };

  const handlePlusPress = () => {
      navigation.navigate('AddCustomer');
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = customersData.map(section => ({
      title: section.title,
      data: section.data.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      ),
    })).filter(section => section.data.length > 0);
    setFilteredData(filtered);
  };

  // Delete selected customers
  const deleteCustomers = () => {
    setShowDeleteModal(false);
    const updatedData = customersData.map(section => ({
      title: section.title,
      data: section.data.filter(item => !selectedCustomers.includes(item.id))
    })).filter(section => section.data.length > 0);
    
    setCustomersData(updatedData);
    setFilteredData(updatedData);
    setSelectedCustomers([]);
    setIsDeleteMode(false);
    setShowSuccessModal(true);
  };

  // Render each customer item
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.customerItem,
        selectedCustomers.includes(item.id) && styles.selectedCustomer
      ]}
      onPress={() => {
        if (isDeleteMode) {
          toggleCustomerSelection(item.id);
        } else {
          navigation.navigate('CustomerDetails', { customerId: item.id });
        }
      }}
      onLongPress={() => !isDeleteMode && (setIsDeleteMode(true), toggleCustomerSelection(item.id))}
    >
      {isDeleteMode && (
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            selectedCustomers.includes(item.id) && styles.checkedBox
          ]}>
            {selectedCustomers.includes(item.id) && (
              <FontAwesome6 name="check" size={14} iconStyle='solid' color="#fff" />
            )}
          </View>
        </View>
      )}
      
      <Avatar name={item.name} size={50} style={{ marginRight: 12 }} />
      <View style={styles.customerContent}>
        <Text style={styles.customerName}>{item.name}</Text>
      </View>
      
      {!isDeleteMode && (
        <FontAwesome6 name="chevron-right" iconStyle='solid' size={16} color="#999" />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const dismissKeyboardAndMenu = () => {
    Keyboard.dismiss();
    setShowFilterMenu(false);
  };

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
          <View>
            {isDeleteMode ? (
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={toggleDeleteMode}>
                  <Text style={styles.headerButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
                  {selectedCustomers.length} Selected
                </Text>
                
                <TouchableOpacity 
                  onPress={() => selectedCustomers.length > 0 && setShowDeleteModal(true)}
                  disabled={selectedCustomers.length === 0}
                >
                  <Text style={[
                    styles.headerButtonText,
                    selectedCustomers.length === 0 && styles.disabledButton
                  ]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.headerContent]}>
                <View style={{ width: 24 }} /> {/* Empty view for balance */}
                
                <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
                  Customers
                </Text>
                
                <TouchableOpacity onPress={() => setShowFilterMenu(!showFilterMenu)}>
                  <FontAwesome6 
                    name="ellipsis-vertical" 
                    iconStyle='solid' 
                    size={24} 
                    color={colors.white} 
                    style={{ marginRight: 10}}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ImageBackground>

         {/* Popup Menu */}
         {showFilterMenu && (
          <View style={styles.popupMenu}>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Export Customers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Import CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Create Segment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupMenuItem}>
              <Text style={styles.popupMenuText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome6 name="magnifying-glass" iconStyle='solid' size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Customers List */}
        <SectionList
          sections={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

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
                Delete {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}?
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
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.successModal}>
              <FontAwesome6 name="circle-check" iconStyle='solid' size={60} color={colors.primary} />
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successMessage}>
                Customer{selectedCustomers.length !== 1 ? 's' : ''} deleted
              </Text>
              
              <TouchableOpacity 
                style={styles.successButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity
              style={[styles.fab, {bottom: 30}]}
              onPress={handlePlusPress}
            >
              <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1, // Bring the button to front
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCustomer: {
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customerContent: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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

export default CustomersList;