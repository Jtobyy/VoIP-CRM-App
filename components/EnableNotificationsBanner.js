// components/EnableNotificationsBanner.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { initFcm } from '../firebase/fcm';

export default function EnableNotificationsBanner() {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // Check current OS-level status
      const s = await notifee.getNotificationSettings();
      const granted = s.authorizationStatus === AuthorizationStatus.AUTHORIZED
        || s.authorizationStatus === AuthorizationStatus.PROVISIONAL;
      setVisible(!granted);      // show only if not granted
      setChecking(false);
    })();
  }, []);

  if (checking || !visible) return null;

  const requestNow = async () => {
    // 1) Trigger system permission prompt immediately after the message
    await initFcm({ prompt: true });

    // 2) Re-check permission
    const s = await notifee.getNotificationSettings();
    const granted = s.authorizationStatus === AuthorizationStatus.AUTHORIZED
      || s.authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (granted) {
      setVisible(false);
      return;
    }

    // 3) If still not granted, offer to open Settings (allowed by Apple)
    Alert.alert(
      'Turn On Notifications',
      'Enable notifications in Settings to get real-time updates.',
      [
        { text: 'Open Settings', onPress: () => notifee.openSettings().catch(() => Linking.openSettings?.()) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={{ padding: 12, borderRadius: 10, margin: 12, backgroundColor: 'rgba(0,0,0,0.05)' }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Stay in the loop</Text>

      {/* Important: don't mention microphone here; this banner is for notifications only */}
      <Text style={{ opacity: 0.8, marginBottom: 12 }}>
        Turn on notifications to get real-time updates on calls, tasks and messages.
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={requestNow}
          style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#1e90ff' }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Continue</Text>
        </TouchableOpacity>

        {/* Apple asked not to provide an exit button before the prompt.
           If you really want "Not now", keep it ONLY on Android. */}
        {Platform.OS === 'android' && (
          <TouchableOpacity
            onPress={() => setVisible(false)}
            style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' }}
          >
            <Text>Not now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
