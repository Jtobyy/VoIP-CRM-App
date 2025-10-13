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
} from 'react-native';
import { colors } from '../../../styles/global';
import { useApi } from '../../../hooks/useApi';
import { useLoading } from '../../../hooks/useLoading';
import { useError } from '../../../hooks/useError';

const HotlinesList = ({ navigation }) => {
  const [hotlines, setHotlines] = useState([]);
  const [selectedHotline, setSelectedHotline] = useState(null);
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  // Color schemes for hotline cards
  const cardColors = [
    { bg: '#4CAF50', icon: '#2E7D32' }, // Green
    { bg: '#2196F3', icon: '#1565C0' }, // Blue
    { bg: '#FF7043', icon: '#D84315' }, // Orange
    { bg: '#66BB6A', icon: '#388E3C' }, // Light Green
    { bg: '#42A5F5', icon: '#1976D2' }, // Light Blue
    { bg: '#FF8A65', icon: '#E64A19' }, // Light Orange
  ];

  const fetchHotlines = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hotlines/`);
      setHotlines(res.data?.results || []);
    } catch (error) {
      console.error('Failed to fetch hotlines:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotlines();
  }, []);

  const handleHotlineSelect = (hotline) => {
    setSelectedHotline(hotline.id === selectedHotline ? null : hotline.id);
  };

  const handleProceed = () => {
    if (selectedHotline) {
      const selected = hotlines.find(h => h.id === selectedHotline);
      // Navigate to next screen or perform action with selected hotline
      console.log('Selected hotline:', selected);
      // navigation.navigate('NextScreen', { hotline: selected });
    }
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
        {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../../assets/backWhite.png')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Get a hotline now</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* Hotlines Grid */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hotlines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hotlines available at the moment.</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {hotlines.map((hotline, index) => {
              const colorScheme = cardColors[index % cardColors.length];
              const isSelected = selectedHotline === hotline.id;

              return (
                <TouchableOpacity
                  key={hotline.id}
                  style={styles.hotlineCard}
                  onPress={() => handleHotlineSelect(hotline)}
                  activeOpacity={0.8}
                >
                  {/* Header with icon and title */}
                  {/* <View style={[styles.cardHeader, { backgroundColor: colorScheme.bg }]}>
                    <View style={[styles.iconCircle, { backgroundColor: colorScheme.icon }]}>
                      <Image
                        source={require('../../../assets/phone_white.png')}
                        style={styles.phoneIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.hotlineTitle}>
                      Hotline {index + 1}
                    </Text>
                  </View> */}

                  {/* Phone number and selection indicator */}
                  <View style={styles.cardBody}>
                    <Text style={styles.phoneNumber}>
                      {hotline.phone_number || '+234 810 179 0957'}
                    </Text>
                    <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                      {isSelected && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Proceed Button */}
      <TouchableOpacity
        style={[
          styles.proceedButton,
          !selectedHotline && styles.proceedButtonDisabled
        ]}
        onPress={handleProceed}
        disabled={!selectedHotline}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </TouchableOpacity>
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

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  hotlineCard: {
    width: '48%',
    marginBottom: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  phoneIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },

  hotlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cardBody: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
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
});

export default HotlinesList;