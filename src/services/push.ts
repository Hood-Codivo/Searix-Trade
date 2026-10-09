import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { marketApi } from '@/services/api';

// Banner + sound even while the app is open -- without this, a notification that arrives in the
// foreground is delivered silently with no banner, which looks like the feature doesn't work.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class PushUnavailableError extends Error {}

// Requests permission and returns a real Expo push token, or throws if this device/build can't get one
// (a simulator, or permission denied) -- callers show that reason rather than silently doing nothing.
async function obtainPushToken(): Promise<string> {
  if (!Device.isDevice) {
    throw new PushUnavailableError('Push notifications need a real phone -- they don’t work in a simulator.');
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Price & premium alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.status === 'granted'
    ? true
    : (await Notifications.requestPermissionsAsync()).status === 'granted';
  if (!granted) {
    throw new PushUnavailableError('Notification permission was not granted. Enable it in your phone’s system settings.');
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token;
}

// Turns alerts on for this wallet: gets a push token and registers it with the backend.
export async function enablePushAlerts(walletAddress: string): Promise<void> {
  const token = await obtainPushToken();
  await marketApi.registerPushToken(walletAddress, token);
}

// Turns alerts off: removes this wallet's token from the backend. The OS-level permission is left as is --
// only the backend stops being told to send anything, which is what the toggle promises.
export async function disablePushAlerts(walletAddress: string): Promise<void> {
  await marketApi.unregisterPushToken(walletAddress);
}
