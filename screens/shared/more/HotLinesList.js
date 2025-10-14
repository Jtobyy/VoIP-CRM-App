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
  const [dids, setDids] = useState([]);
  const [selectedDid, setSelectedDid] = useState(null);
  const { api } = useApi();
  const { setLoading } = useLoading();
  const { handleApiError } = useError();

  // Image mapping - require() doesn't work with dynamic paths
  const imageMap = {
    lightgreenct: require('../../../assets/lightgreenct.png'),
    lightbluect: require('../../../assets/lightbluect.png'),
    lightorangect: require('../../../assets/lightorangect.png'),
  };

  // Color schemes for DID cards - matching the UI
  const cardColors = [
    { bg: '#4CAF50', icon: '#2E7D32', headerBg: '#66BB6A', image: 'lightgreenct' }, // Gree
    { bg: '#2196F3', icon: '#1565C0', headerBg: '#42A5F5', image: 'lightgreenct' }, // Blue
    { bg: '#FF7043', icon: '#D84315', headerBg: '#FF8A65', image: 'lightorangect' }, // Orange
    { bg: '#66BB6A', icon: '#388E3C', headerBg: '#81C784', image: 'lightgreenct' }, // Light Green
    { bg: '#42A5F5', icon: '#1976D2', headerBg: '#64B5F6', image: 'lightorangect' }, // Light Blue
    { bg: '#FF8A65', icon: '#E64A19', headerBg: '#FFAB91', image: 'lightorangect' }, // Light Orange
  ];

  const fetchDids = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/call-center/pbx/dids/available/`);
      setDids(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch DIDs:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDids();
  }, []);

  const handleDidSelect = (did) => {
    setSelectedDid(did.did_id === selectedDid ? null : did.did_id);
  };

  const handleProceed = () => {
    if (selectedDid) {
      const selected = dids.find(d => d.did_id === selectedDid);
      // Navigate to next screen or perform action with selected DID
      console.log('Selected DID:', selected);
      // navigation.navigate('NextScreen', { did: selected });
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../../assets/backWhite.png')}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get a hotline now</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* DIDs Grid */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dids.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hotlines available at the moment.</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {dids.map((did, index) => {
              const colorScheme = cardColors[index % cardColors.length];
              const isSelected = selectedDid === did.did_id;

              return (
                <TouchableOpacity
                  key={did.did_id}
                  style={styles.hotlineCard}
                  onPress={() => handleDidSelect(did)}
                  activeOpacity={0.8}
                >
                  {/* Header with icon and title */}
                  <View style={[styles.cardHeader, { backgroundColor: colorScheme.headerBg }]}>
                    <Image
                      source={imageMap[colorScheme.image]}
                      style={styles.phoneIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.hotlineTitle}>
                      Hotline {index + 1}
                    </Text>
                  </View>

                  {/* Phone number and selection indicator */}
                  <View style={styles.cardBody}>
                    <Text style={styles.phoneNumber}>
                      {did.number}
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
          !selectedDid && styles.proceedButtonDisabled
        ]}
        onPress={handleProceed}
        disabled={!selectedDid}
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
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  phoneIcon: {
    width: 250,
    height: 100,
    bottom: -30,
    left: 0,
    tintColor: '#FFFFFF',
    position: 'absolute'
  },

  hotlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cardBody: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  phoneNumber: {
    fontSize: 15,
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