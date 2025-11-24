import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  ScrollView,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { colors, typography } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';
import { useSnackbar } from '../../../hooks/useSnackbar';
import AddProductModal from '../../../components/Modals/more/AddProductModal';
import AdjustStockModal from '../../../components/Modals/more/AdjustStockModal';
import DeleteProductModal from '../../../components/Modals/more/DeleteProductModal';
import ProductSuccessModal from '../../../components/Modals/more/ProductSuccessModal';


const Products = ({ navigation }) => {
  // Dummy data for products
  const dummyProducts = [
    {
      id: 1,
      name: 'Premium Coffee Beans',
      category: 'Beverages',
      selling_price: 2500,
      cost_price: 1800,
      stock: 45,
    },
    {
      id: 2,
      name: 'Wireless Headphones',
      category: 'Electronics',
      selling_price: 2500,
      cost_price: 1800,
      stock: 45,
    },
    {
      id: 3,
      name: 'USB Cable',
      category: 'Electronics',
      selling_price: 2500,
      cost_price: 1800,
      stock: 0,
    },
  ];

  const [products, setProducts] = useState(dummyProducts);
  const [filteredProducts, setFilteredProducts] = useState(dummyProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const { setLoading } = useLoading();

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAddProduct = (productData) => {
    const newProduct = {
      id: products.length + 1,
      ...productData,
    };
    setProducts([...products, newProduct]);
    setShowAddModal(false);
    setSuccessMessage('Product added successfully');
    setShowSuccessModal(true);
  };

  const handleAdjustStock = (quantity) => {
    const updatedProducts = products.map(p =>
      p.id === selectedProduct.id
        ? { ...p, stock: p.stock + quantity }
        : p
    );
    setProducts(updatedProducts);
    setShowAdjustModal(false);
    setSuccessMessage('Stock adjusted successfully');
    setShowSuccessModal(true);
  };

  const handleDeleteProduct = () => {
    const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
    setProducts(updatedProducts);
    setShowDeleteModal(false);
    setSuccessMessage('Product deleted successfully');
    setShowSuccessModal(true);
  };

  const openAdjustStock = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const openDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const formatCurrency = (amount) => {
    return `₦${Number(amount).toLocaleString()}`;
  };

  const renderProduct = (product) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <TouchableOpacity
          onPress={() => openDeleteProduct(product)}
          style={styles.deleteButton}
        >
          <FontAwesome6
            name="trash-can"
            size={18}
            color="#999"
            iconStyle='solid'
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.productCategory}>{product.category}</Text>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Selling Price</Text>
          <Text style={styles.detailValue}>{formatCurrency(product.selling_price)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cost Price</Text>
          <Text style={styles.detailValue}>{formatCurrency(product.cost_price)}</Text>
        </View>
      </View>

      <View style={styles.stockSection}>
        <View style={styles.stockInfo}>
          <Text style={styles.detailLabel}>Available Stock</Text>
          <View style={styles.stockRow}>
            <Text style={styles.stockValue}>{product.stock}</Text>
            <View
              style={[
                styles.stockBadge,
                product.stock > 0 ? styles.inStockBadge : styles.outOfStockBadge,
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  product.stock > 0 ? styles.inStockText : styles.outOfStockText,
                ]}
              >
                {product.stock > 0 ? 'In stock' : 'Out of stock'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => openAdjustStock(product)}
        >
          <Text style={styles.adjustButtonText}>Adjust Stock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Header */}
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../../assets/backWhite.png')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome6
          name="magnifying-glass"
          size={16}
          color="#999"
          style={styles.searchIcon}
          iconStyle='solid'
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.productsList}
        contentContainerStyle={styles.productsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No products found' : 'Tap ⊕ to add products'}
            </Text>
          </View>
        ) : (
          filteredProducts.map(renderProduct)
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowAddModal(true)}
      >
        <FontAwesome6
          name="plus"
          size={24}
          color="white"
          iconStyle='solid'
        />
      </TouchableOpacity>

      {/* Modals */}
      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddProduct}
      />

      <AdjustStockModal
        visible={showAdjustModal}
        product={selectedProduct}
        onClose={() => setShowAdjustModal(false)}
        onSubmit={handleAdjustStock}
      />

      <DeleteProductModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
      />

      <ProductSuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </View>
  );
};

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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    // Simple back button without extra styling
  },
  backButtonIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 20, // Same width as back button icon for centering
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
  },
  productsList: {
    flex: 1,
  },
  productsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  productDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  stockSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stockInfo: {
    flex: 1,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  stockValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginRight: 12,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inStockBadge: {
    backgroundColor: '#DCFCE7',
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStockText: {
    color: '#22C55E',
  },
  outOfStockText: {
    color: '#EF4444',
  },
  adjustButton: {
    marginTop: 4,
  },
  adjustButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default Products;