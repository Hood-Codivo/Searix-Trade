import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PREFERENCE_KEY = 'searix-app-lock-enabled';

// Whether this device can even do biometric/passcode auth -- a Profile toggle checks this before
// offering the setting, rather than letting someone turn on a lock their device can't satisfy.
export async function isAppLockAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getAppLockPreference(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(PREFERENCE_KEY).catch(() => null);
  return value === 'true';
}

export async function setAppLockPreference(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(PREFERENCE_KEY, enabled ? 'true' : 'false');
}

// One biometric/passcode check, for opening the app -- never called around trade signing, which the
// wallet app already gates on its own. Returns false on cancel, failure, or a device with nothing enrolled.
export async function authenticateToOpen(): Promise<boolean> {
  const available = await isAppLockAvailable();
  if (!available) return true; // nothing to check against -- don't lock someone out of their own app
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Searix Trade',
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  return result.success;
}
