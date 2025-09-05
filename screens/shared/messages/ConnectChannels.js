import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { colors } from '../../../styles/global';
import { useLoading } from '../../../hooks/useLoading';
import { useApi } from '../../../hooks/useApi';
import { useError } from '../../../hooks/useError';

const ConnectChannels = ({ navigation }) => {
  const { setLoading } = useLoading();
  const { api } = useApi();
  const { handleApiError } = useError();

  const [channels, setChannels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/channels/all/');
      // Expecting { channels: [...], success: true }
      setChannels(Array.isArray(res?.data?.channels) ? res.data.channels : []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchChannels();
    } finally {
      setRefreshing(false);
    }
  }, [fetchChannels]);

  const onConnectPress = (channel) => {
    // If already connected, maybe navigate to a "Manage" screen
    // Otherwise, navigate to a "Connect" flow
    // 🔧 Replace route names below with yours
    if (channel.connected) {
      navigation.navigate('ManageChannel', { channelId: channel.id, channel });
    } else {
      navigation.navigate('ConnectChannel', { channelId: channel.id, channel });
    }
  };

  return (
    <View style={styles.container}>
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

        <Text style={styles.headerTitle}>Connect Channels</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      {/* Title */}
      <Text style={styles.subtitle}>Select the accounts you want to connect</Text>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {channels.map((platform) => (
          <View key={platform.id} style={styles.card}>
            {/* Channel icon from API */}
            <Image source={{ uri: platform.image }} style={styles.icon} />

            <View style={{ flex: 1 }}>
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={styles.platformDesc}>{platform.description}</Text>
            </View>

            <TouchableOpacity
              onPress={() => onConnectPress(platform)}
              style={[
                styles.connectButton,
                platform.connected && styles.connectedButton,
              ]}
            >
              <Text
                style={[
                  styles.connectText,
                  platform.connected && styles.connectedText,
                ]}
              >
                {platform.connected ? 'Connected' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Save and Skip */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => navigation.goBack()} 
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ConnectChannels;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 34, // Same width as back button for centering
  },
  progressLine: {
    height: 3,
    backgroundColor: colors.primary,
    flex: 1,
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  subtitle: {
    color: 'black',
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 30
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  platformName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  platformDesc: {
    color: '#777',
    fontSize: 13,
  },
  connectButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectText: {
    fontSize: 13,
    color: '#999',
  },
  connectedButton: {
    backgroundColor: '#dcfce7',
  },
  connectedText: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  whatsappCTA: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  whatsappText: {
    color: '#2c6efc',
    fontSize: 16,
  },
  backButtonIcon: {
    width: 20,
    height: 20
  },
});
