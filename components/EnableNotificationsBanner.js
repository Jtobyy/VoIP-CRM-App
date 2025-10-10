// components/EnableNotificationsBanner.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { initFcm } from '../firebase/fcm';

export default function EnableNotificationsBanner() {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // 1) Check current OS-level status to decide if we should show the banner
      const s = await notifee.getNotificationSettings();
      const blocked =
        s.authorizationStatus === AuthorizationStatus.DENIED ||
        s.authorizationStatus === AuthorizationStatus.BLOCKED;

      const granted = s.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      setVisible(!granted); // show banner only if not already granted
      setChecking(false);
    })();
  }, []);

  if (checking || !visible) return null;

  const enable = async () => {
    // 2) Try prompting once via our safe init (user gesture)
    await initFcm({ prompt: true });

    // 3) Re-check; if still not authorized, offer to open settings
    const s = await notifee.getNotificationSettings();
    const granted = s.authorizationStatus === AuthorizationStatus.AUTHORIZED;

    if (!granted) {
      // iOS & Android: open app notification settings
      try {
        await notifee.openSettings();
      } catch {
        // Fallback: generic app settings
        Linking.openSettings?.();
      }
    } else {
      setVisible(false); // hide banner once enabled
    }
  };

  return (
    <View style={{
      padding: 12, borderRadius: 10, margin: 12,
      backgroundColor: 'rgba(0,0,0,0.05)'
    }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>
        Stay in the loop
      </Text>
      <Text style={{ opacity: 0.8, marginBottom: 12 }}>
        Enable notifications and microphone to make and receive calls and get real-time updates on tasks and messages.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={enable}
          style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#1e90ff' }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Enable</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVisible(false)}
          style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' }}
        >
          <Text>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
