import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const AdjustStockModal = ({ visible, product, onClose, onSubmit }) => {
  const [quantity, setQuantity] = useState(2);

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(quantity);
    setQuantity(2);
  };

  const handleClose = () => {
    setQuantity(2);
    onClose();
  };

  if (!product) return null;

  return (
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
            <Text style={styles.title}>Adjust Stock</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <FontAwesome6 name="xmark" size={20} color="#000" iconStyle='solid' />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.infoLabel}>Product</Text>
              <Text style={styles.productName}>{product.name}</Text>

              <Text style={[styles.infoLabel, { marginTop: 16 }]}>Current Stock</Text>
              <Text style={styles.currentStock}>{product.stock}</Text>
            </View>

            {/* Quantity Adjuster */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity to add</Text>

              <View style={styles.quantityAdjuster}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={handleDecrement}
                >
                  <FontAwesome6
                    name="minus"
                    size={20}
                    color="#999"
                    iconStyle='solid'
                  />
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.adjustButton, styles.incrementButton]}
                  onPress={handleIncrement}
                >
                  <FontAwesome6
                    name="plus"
                    size={20}
                    color="#fff"
                    iconStyle='solid'
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Update Button */}
            <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
              <Text style={styles.updateButtonText}>Update Stock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    paddingBottom: 34,
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  productInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  currentStock: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  quantitySection: {
    marginBottom: 32,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  quantityAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    backgroundColor: colors.primary,
  },
  quantityDisplay: {
    minWidth: 100,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdjustStockModal;