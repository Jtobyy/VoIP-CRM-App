import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import AddCategoryModal from './AddCategoryModal';

const AddProductModal = ({ visible, onClose, onSubmit }) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Sample categories - replace with actual data from API
  const categories = ['Beverages', 'Electronics', 'Clothing', 'Food'];

  const handleSubmit = () => {
    if (!productName || !category || !sellingPrice || !costPrice) {
      alert('Please fill in all required fields');
      return;
    }

    const productData = {
      name: productName,
      category: category,
      selling_price: parseFloat(sellingPrice),
      cost_price: parseFloat(costPrice),
      initial_stock: parseInt(initialStock) || 0,
    };

    onSubmit(productData);
    resetForm();
  };

  const resetForm = () => {
    setProductName('');
    setCategory('');
    setSellingPrice('');
    setCostPrice('');
    setInitialStock('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddCategory = (newCategory) => {
    setCategory(newCategory);
    setShowCategoryModal(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          {/* Empty touchable area to close modal */}
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* Bottom Sheet */}
          <View style={styles.bottomSheet}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add New Product</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <FontAwesome6 name="xmark" size={20} color="#000" iconStyle='solid' />
              </TouchableOpacity>
            </View>

            {/* Form - ScrollView */}
            <ScrollView
              style={styles.formContainer}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter product name"
                  placeholderTextColor="#999"
                  value={productName}
                  onChangeText={setProductName}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Product Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                    <Text style={styles.addNewText}>Add new category</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={[styles.dropdownText, !category && styles.placeholderText]}>
                    {category || 'Select category'}
                  </Text>
                  <FontAwesome6
                    name="chevron-down"
                    size={14}
                    color="#999"
                    iconStyle='solid'
                  />
                </TouchableOpacity>

                {/* Dropdown List */}
                {showCategoryDropdown && (
                  <View style={styles.dropdownList}>
                    {categories.map((cat, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Selling Price & Cost Price */}
              <View style={styles.priceRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Selling Price</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.currencySymbol}>₦</Text>
                    <TextInput
                      style={styles.priceInputField}
                      placeholder=""
                      placeholderTextColor="#999"
                      value={sellingPrice}
                      onChangeText={setSellingPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Cost Price</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.currencySymbol}>₦</Text>
                    <TextInput
                      style={styles.priceInputField}
                      placeholder=""
                      placeholderTextColor="#999"
                      value={costPrice}
                      onChangeText={setCostPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Initial Stock Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Initial Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={initialStock}
                  onChangeText={setInitialStock}
                  keyboardType="numeric"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Add Product</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleAddCategory}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addNewText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dropdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dropdownText: {
    fontSize: 15,
    color: '#111',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#111',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginRight: 8,
  },
  priceInputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddProductModal;