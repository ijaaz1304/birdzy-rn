/**
 * @format
 */

import Geolocation from '@react-native-community/geolocation';
import { AppRegistry } from 'react-native';
import { registerAndroidBackgroundPush } from './src/services/notifications/backgroundPush';
import App from './App';
import { name as appName } from './app.json';

// Foreground-only location. Do not request Always — avoids ITMS-90683 and matches Info.plist.
Geolocation.setRNConfiguration({
  // Permissions are requested via react-native-permissions only — avoid a second native prompt from Geolocation.
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: false,
  locationProvider: 'auto',
});

// React Native 0.81+ removed built-in Geolocation — polyfill navigator.geolocation
if (!global.navigator) {
  global.navigator = {};
}
if (!global.navigator.geolocation) {
  global.navigator.geolocation = Geolocation;
}

if (__DEV__) {
  console.log(
    '[LOCATION] geolocation polyfill ready (whenInUse only):',
    !!global.navigator?.geolocation,
  );
}

registerAndroidBackgroundPush();

AppRegistry.registerComponent(appName, () => App);
