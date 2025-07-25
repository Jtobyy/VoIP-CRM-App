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
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../../styles/global';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Sample data - replace with your actual data source
const initialCustomersData = [
  {
    title: 'A',
    data: [
      { id: 'AF', name: 'Adedoyin Folakemi' },
      { id: 'AC', name: 'Adetayo Cassandra' },
      { id: 'AL', name: 'Adriana La Cerva' },
      { id: 'AS', name: 'Alidae Shimana' },
      { id: 'AN', name: 'Amaka new customer' },
    ],
  },
  {
    title: 'C',
    data: [
      { id: 'CF', name: 'Cassandra Fakoya' },
      { id: 'CL', name: 'Customer Lekki 1' },
    ],
  },
  {
    title: 'E',
    data: [
      { id: 'ED', name: 'Eniola Daniels' },
      { id: 'EM', name: 'Ez Moreno Papi Ioko' },
    ],
  },
];

const ManageCustomers = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customersData, setCustomersData] = useState(initialCustomersData);
  const [filteredData, setFilteredData] = useState(initialCustomersData);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedCustomers([]); // Clear selection when exiting delete mode
    }
  };

  // Handle customer selection
  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === '') {
      setFilteredData(customersData);
    } else {
      const filtered = customersData.map(section => ({
        title: section.title,
        data: section.data.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter(section => section.data.length > 0);
      setFilteredData(filtered);
    }
  };

  // Delete selected customers
  const deleteCustomers = () => {
    setShowDeleteModal(false);
    
    // Filter out the selected customers
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
      onLongPress={() => {
        if (!isDeleteMode) {
          setIsDeleteMode(true);
          toggleCustomerSelection(item.id);
        }
      }}
    >
      {isDeleteMode && (
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            selectedCustomers.includes(item.id) && styles.checkedBox
          ]}>
            {selectedCustomers.includes(item.id) && (
              <Icon name="check" size={16} color="#fff" />
            )}
          </View>
        </View>
      )}
      
      <View style={styles.customerInitials}>
        <Text style={styles.initialsText}>{item.id}</Text>
      </View>
      
      <Text style={styles.customerName}>{item.name}</Text>
      
      {!isDeleteMode && <Icon name="chevron-right" size={24} color="#999" />}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header with mode toggle */}
      <View style={styles.header}>
        {isDeleteMode ? (
          <>
            <TouchableOpacity onPress={toggleDeleteMode}>
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
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
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Manage Customer</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateCustomer')}>
              <Text style={styles.headerButtonText}>Create</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Q Search..."
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
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.confirmationModal}>
            <Text style={styles.modalTitle}>Are you sure to remove {selectedCustomers.length > 1 ? 'these customers' : 'this customer'}?</Text>
            
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
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.successModal}>
            <Icon name="check-circle" size={60} color={colors.primary} />
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>Customer{selectedCustomers.length > 1 ? 's' : ''} deleted successfully</Text>
            
            <TouchableOpacity 
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Okay, Thank You!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
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
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
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
  customerInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
});

export default ManageCustomers;