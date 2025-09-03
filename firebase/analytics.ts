import analytics from '@react-native-firebase/analytics';

export async function trackScreen(name: string) {
  await analytics().logScreenView({ screen_name: name, screen_class: name });
}
