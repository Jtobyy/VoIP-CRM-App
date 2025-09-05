import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useUnread } from '../screens/shared/notifications/UnreadProvider';

export function BellButton({ navigation, style, hitSlop }) {
  const { unreadCount } = useUnread();
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={style}
      hitSlop={hitSlop}
    >
      <Image
        source={
          hasUnread
            ? require('../assets/bell_with_dot.png') // your alt asset
            : require('../assets/bell.png')
        }
        style={{ width: 22, height: 22 }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}
