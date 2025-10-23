import React, { useState, useEffect } from 'react';
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
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';

const Subscription = ({ navigation }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionCount, setExtensionCount] = useState(2);
  const [plans, setPlans] = useState([]);
  const [extensionPrice, setExtensionPrice] = useState(2000);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  const FREE_PLAN_ID = 3;

  // Image mapping for plan headers
  const imageMap = {
    lightgreen: require('../../../assets/lightgreenct.png'),
    lightblue: require('../../../assets/lightbluect.png'),
  };

  useEffect(() => {
    fetchCurrentSubscription();
    fetchPlans();
    fetchExtensionPricing();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const res = await api.get('/billings/subscriptions/current/');
      
      if (res.data?.success && res.data?.subscription?.is_active) {
        setActiveSubscription(res.data.subscription);
        setHasActiveSubscription(true);
      } else {
        // No active subscription from API - default to free plan as active
        setHasActiveSubscription(false);
        setActiveSubscription({ plan: { id: FREE_PLAN_ID } });
      }
    } catch (error) {
      console.error('No active subscription found - defaulting to free plan');

      handleApiError(error);
      // Default to free plan as active
      setHasActiveSubscription(false);
      setActiveSubscription({ plan: { id: FREE_PLAN_ID } });
    }
  };

  const fetchExtensionPricing = async () => {
    try {
      const res = await api.get('/billings/did-pricing/');
      
      if (res.data?.success && res.data?.pricing?.price_per_extension) {
        setExtensionPrice(parseFloat(res.data.pricing.price_per_extension));
      }
    } catch (error) {
      console.error('Failed to fetch extension pricing:', error);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billings/plans/mobile/');
      
      if (res.data?.success && res.data?.plans) {
        const formattedPlans = res.data.plans.map((plan, index) => {
          const isFree = parseFloat(plan.price) === 0;
          
          let displayFeatures = [];
          
          if (isFree) {
            const includedFeatures = plan.features.map(feature => ({
              text: feature.description,
              included: true,
            }));
            
            displayFeatures = [
              ...includedFeatures,
              { text: 'Business phone number', included: false },
              { text: 'WhatsApp and Facebook', included: false },
            ];
          } else {
            const premiumFeatures = plan.features
              .filter(f => !['live_chat', 'email', 'basic_analytics'].includes(f.code))
              .map(feature => ({
                text: feature.description,
                included: true,
              }));
            
            displayFeatures = [
              { text: 'Everything in Free', included: true },
              ...premiumFeatures,
            ];
          }

          return {
            id: plan.id.toString(),
            name: plan.name,
            price: isFree ? 'Free' : `₦${parseFloat(plan.price).toLocaleString()}`,
            priceNote: isFree ? null : '/month',
            headerBg: isFree ? '#4CAF50' : '#2196F3',
            iconBg: isFree ? '#2E7D32' : '#1565C0',
            image: isFree ? 'lightgreen' : 'lightblue',
            features: displayFeatures,
            rawPrice: parseFloat(plan.price),
            duration_label: plan.duration_label,
            paystack_plan_code: plan.paystack_plan_code,
            isFree,
          };
        });
        
        // Sort plans: premium plans first, free plan last
        const sortedPlans = formattedPlans.sort((a, b) => {
          if (a.isFree && !b.isFree) return 1;
          if (!a.isFree && b.isFree) return -1;
          return 0;
        });
        
        setPlans(sortedPlans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    // Free plan is never selectable
    if (plan.isFree) return;
    
    // Don't allow selection if there's an active premium subscription
    if (shouldDisablePlanSelection()) return;
    
    setSelectedPlan(plan.id === selectedPlan ? null : plan.id);
  };

  const handleProceed = () => {
    if (!selectedPlan) return;
    
    // Don't allow proceeding if there's an active premium subscription
    if (shouldDisablePlanSelection()) return;
    
    const selected = plans.find(p => p.id === selectedPlan);
  
    if (selected.rawPrice > 0) {
      setShowExtensionModal(true);
    } else {
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
    const selected = plans.find(p => p.id === selectedPlan);
    if (!selected) return 0;
    
    const basePrice = selected.rawPrice;
    const additionalExtensions = extensionCount - 2;
    const additionalCost = additionalExtensions * extensionPrice;
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

  const isActivePlan = (planId) => {
    return activeSubscription?.plan?.id?.toString() === planId;
  };

  const isFreePlan = () => {
    return activeSubscription?.plan?.id === FREE_PLAN_ID;
  };

  const shouldDisablePlanSelection = () => {
    // Only disable if there's an active premium (non-free) subscription
    return hasActiveSubscription && !isFreePlan();
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
        {hasActiveSubscription && !isFreePlan() ? 'Your Active Plan' : 'Select a Plan'}
      </Text>

      {/* Active Subscription Banner - Only show for premium plans */}
      {hasActiveSubscription && activeSubscription && !isFreePlan() && (
        <View style={styles.activeSubscriptionBanner}>
          <View style={styles.bannerIconContainer}>
            <FontAwesome6 name="circle-check" size={20} color="#4CAF50" iconStyle="solid" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Active Subscription</Text>
            <Text style={styles.bannerSubtitle}>
              {activeSubscription.days_remaining} days remaining
            </Text>
          </View>
        </View>
      )}

      {/* Plans List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isActive = isActivePlan(plan.id);
          const isDisabled = shouldDisablePlanSelection() && !isActive;
          const isPlanFree = plan.isFree;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isActive && styles.planCardActive,
                isDisabled && styles.planCardDisabled,
              ]}
              onPress={() => handlePlanSelect(plan)}
              activeOpacity={isPlanFree || isDisabled ? 1 : 0.8}
              disabled={isPlanFree || isDisabled}
            >
              {/* Active Tag */}
              {isActive && (
                <View style={styles.activeTag}>
                  <FontAwesome6 name="crown" size={12} color="#FFF" iconStyle="solid" />
                  <Text style={styles.activeTagText}>ACTIVE</Text>
                </View>
              )}

              {/* Header with icon and plan name */}
              <View style={[
                styles.cardHeader, 
                { backgroundColor: plan.headerBg },
                isDisabled && styles.cardHeaderDisabled,
              ]}>
                <Image
                  source={imageMap[plan.image]}
                  style={[
                    styles.planIcon,
                    isDisabled && styles.planIconDisabled,
                  ]}
                  resizeMode="contain"
                />
                <Text style={[
                  styles.planName,
                  isDisabled && styles.planNameDisabled,
                ]}>
                  {plan.name}
                </Text>
              </View>

              {/* Plan body with price and features */}
              <View style={styles.cardBody}>
                {/* Price section */}
                <View style={styles.priceContainer}>
                  <View style={styles.priceRow}>
                    <Text style={[
                      styles.priceText,
                      isDisabled && styles.priceTextDisabled,
                    ]}>
                      {plan.price}
                    </Text>
                    {plan.priceNote && (
                      <Text style={[
                        styles.priceNote,
                        isDisabled && styles.priceNoteDisabled,
                      ]}>
                        {plan.priceNote}
                      </Text>
                    )}
                    {plan.rawPrice === 0 && (
                      <Image
                        source={require('../../../assets/star.png')}
                        style={[
                          styles.starIcon,
                          isDisabled && styles.starIconDisabled,
                        ]}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                  
                  {/* Show radio button only for premium plans that are not active */}
                  {!isActive && !isPlanFree && (
                    <View style={[
                      styles.radioButton, 
                      isSelected && styles.radioButtonSelected,
                      isDisabled && styles.radioButtonDisabled,
                    ]}>
                      {isSelected && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  )}
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
                        style={[
                          styles.featureIcon,
                          isDisabled && styles.featureIconDisabled,
                        ]}
                        resizeMode="contain"
                      />
                      <Text style={[
                        styles.featureText,
                        isDisabled && styles.featureTextDisabled,
                      ]}>
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Proceed Button - Hide only if on active premium plan */}
      {!shouldDisablePlanSelection() && (
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
      )}

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
                  Each additional: +₦{extensionPrice.toLocaleString()}
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

  activeSubscriptionBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  bannerIconContainer: {
    marginRight: 12,
  },

  bannerTextContainer: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },

  bannerSubtitle: {
    fontSize: 14,
    color: '#388E3C',
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
    position: 'relative',
  },

  planCardActive: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },

  planCardDisabled: {
    opacity: 0.5,
  },

  activeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  activeTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  cardHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 55,    
    position: 'relative'
  },

  cardHeaderDisabled: {
    opacity: 0.6,
  },

  planIcon: {
    width: 300,
    height: 100,
    bottom: -25,
    left: 0,
    tintColor: '#FFFFFF',
    position: 'absolute'
  },

  planIconDisabled: {
    opacity: 0.5,
  },

  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },

  planNameDisabled: {
    opacity: 0.7,
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

  priceTextDisabled: {
    color: '#999999',
  },

  priceNote: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 4,
  },

  priceNoteDisabled: {
    color: '#AAAAAA',
  },

  starIcon: {
    width: 24,
    height: 24,
    marginLeft: 8,
  },

  starIconDisabled: {
    opacity: 0.5,
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

  radioButtonDisabled: {
    borderColor: '#E0E0E0',
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

  featureIconDisabled: {
    opacity: 0.5,
  },

  featureText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },

  featureTextDisabled: {
    color: '#999999',
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