import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { colors } from '../../../styles/global';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

const Subscription = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionCount, setExtensionCount] = useState(2);

  // Image mapping for plan headers
  const imageMap = {
    lightgreen: require('../../../assets/lightgreenct.png'),
    lightblue: require('../../../assets/lightbluect.png'),
  };

  // Hardcoded plans
  const plans = [
    {
      id: 'free',
      name: 'Nativetalk Free Plan',
      price: 'Free',
      headerBg: '#4CAF50',
      iconBg: '#2E7D32',
      image: 'lightgreen',
      features: [
        { text: 'Live chat', included: true },
        { text: 'Email', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Business phone number', included: false },
        { text: 'WhatsApp and Facebook', included: false },
      ],
    },
    {
      id: 'premium',
      name: 'Nativetalk Premium Plan',
      price: '₦5,000',
      priceNote: '/month',
      headerBg: '#2196F3',
      iconBg: '#1565C0',
      image: 'lightblue',
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'A hotline', included: true },
        { text: '2 extensions included', included: true },
        { text: 'Advanced analytics', included: true },
      ],
    },
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan.id === selectedPlan ? null : plan.id);
  };

  const handleProceed = () => {
    if (!selectedPlan) return;
    const selected = plans.find(p => p.id === selectedPlan);
  
    if (selected.id === 'premium') {
      setShowExtensionModal(true); // open modal to choose extensions
    } else {
      // Free plan → no payment, 2 default extensions
      navigation.navigate('SubscriptionMakePayment', {
        plan: selected,
        extensions: 2,
        totalPrice: 0,
      });
    }
  };
  

  const handleIncrementExtension = () => {
    setExtensionCount(prev => prev + 1);
  };

  const handleDecrementExtension = () => {
    if (extensionCount > 2) {
      setExtensionCount(prev => prev - 1);
    }
  };

  const calculateTotalPrice = () => {
    const basePrice = 5000;
    const additionalExtensions = extensionCount - 2;
    const additionalCost = additionalExtensions * 2000;
    return basePrice + additionalCost;
  };

  const handleProceedWithExtensions = () => {
    const selected = plans.find(p => p.id === selectedPlan);
    const finalPrice = calculateTotalPrice();
  
    setShowExtensionModal(false);
  
    navigation.navigate('SubscriptionMakePayment', {
      plan: selected,
      extensions: extensionCount,
      totalPrice: finalPrice,
    });
  };
  

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
        <Text style={styles.headerTitle}>Subscription and Pricing</Text>
        <View style={styles.headerRight} />
      </ImageBackground>
      <Text style={styles.selectPlanText}>
            Select a Plan
        </Text>
      {/* Plans List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan, index) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <TouchableOpacity
              key={plan.id}
              style={styles.planCard}
              onPress={() => handlePlanSelect(plan)}
              activeOpacity={0.8}
            >
              {/* Header with icon and plan name */}
              <View style={[styles.cardHeader, { backgroundColor: plan.headerBg }]}>
                <Image
                source={imageMap[plan.image]}
                style={styles.planIcon}
                resizeMode="contain"
                />
                <Text style={styles.planName}>{plan.name}</Text>
              </View>

              {/* Plan body with price and features */}
              <View style={styles.cardBody}>
                {/* Price section */}
                <View style={styles.priceContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>{plan.price}</Text>
                    {plan.priceNote && (
                      <Text style={styles.priceNote}>{plan.priceNote}</Text>
                    )}
                    {plan.id === 'free' && (
                      <Image
                        source={require('../../../assets/star.png')}
                        style={styles.starIcon}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  
                  <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                    {isSelected && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>

                {/* Features list */}
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Image
                        source={
                          feature.included
                            ? require('../../../assets/check_green.png')
                            : require('../../../assets/cross_red.png')
                        }
                        style={styles.featureIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.featureText}>{feature.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Proceed Button */}
      <TouchableOpacity
        style={[
          styles.proceedButton,
          !selectedPlan && styles.proceedButtonDisabled
        ]}
        onPress={handleProceed}
        disabled={!selectedPlan}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </TouchableOpacity>

      {/* Extension Modal */}
      <Modal
        visible={showExtensionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExtensionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Nativetalk Premium Plan</Text>
                <TouchableOpacity onPress={() => setShowExtensionModal(false)}>
                  <FontAwesome6 name="xmark" size={24} color="#333" iconStyle="solid" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {/* Price Display */}
              <View style={styles.priceDisplayContainer}>
                <Text style={styles.modalPriceSymbol}>₦</Text>
                <Text style={styles.modalPriceAmount}>
                  {calculateTotalPrice().toLocaleString()}
                </Text>
                <Text style={styles.modalPriceNote}>/month</Text>
              </View>

              {/* Add Extensions Section */}
              <View style={styles.extensionsSection}>
                <Text style={styles.extensionsSectionTitle}>Add more extensions</Text>

                {/* Counter */}
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[
                      styles.counterButton,
                      extensionCount <= 2 && styles.counterButtonDisabled
                    ]}
                    onPress={handleDecrementExtension}
                    disabled={extensionCount <= 2}
                  >
                    <FontAwesome6 name="minus" size={20} color={extensionCount <= 2 ? '#CCC' : '#666'} iconStyle="solid" />
                  </TouchableOpacity>

                  <View style={styles.counterDisplay}>
                    <Text style={styles.counterNumber}>{extensionCount}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={handleIncrementExtension}
                  >
                    <FontAwesome6 name="plus" size={20} color="#FFF" iconStyle="solid" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.additionalCostText}>
                  Each additional: +₦2,000
                </Text>
              </View>

              {/* Proceed Button */}
              <TouchableOpacity
                style={styles.modalProceedButton}
                onPress={handleProceedWithExtensions}
              >
                <Text style={styles.modalProceedText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectPlanText: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'start',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },

  backButton: {
    padding: 5,
  },
  backButtonIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 34,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  planCard: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  cardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 55,    
    position: 'relative'
  },

  planIcon: {
    width: 300,
    height: 100,
    bottom: -25,
    left: 0,
    tintColor: '#FFFFFF',
    position: 'absolute'
  },

  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },

  cardBody: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },

  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },

  priceNote: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 4,
  },

  starIcon: {
    width: 24,
    height: 24,
    marginLeft: 8,
    tintColor: '#FFD700',
  },

  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },

  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  featuresContainer: {
    gap: 12,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  featureIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },

  featureText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },

  proceedButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },

  proceedButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  proceedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },

  modalHeader: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },

  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  priceDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 40,
  },

  modalPriceSymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 2,
  },

  modalPriceAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#000',
  },

  modalPriceNote: {
    fontSize: 20,
    color: '#666',
    marginLeft: 4,
  },

  extensionsSection: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },

  extensionsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },

  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 24,
  },

  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },

  counterDisplay: {
    width: 100,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },

  additionalCostText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  modalProceedButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  modalProceedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default Subscription;