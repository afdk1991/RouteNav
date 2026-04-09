import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';
import { AuthProvider } from '@/contexts/AuthContext';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
]);

export default function RootLayout() {
  return (
    <Provider>
      <AuthProvider>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false
          }}
        >
          <Stack.Screen name="login" options={{ title: "登录" }} />
          <Stack.Screen name="register" options={{ title: "注册" }} />
          <Stack.Screen name="(tabs)" options={{ title: "" }} />
          <Stack.Screen name="route-detail" options={{ title: "路线详情" }} />
        </Stack>
        <Toast />
      </AuthProvider>
    </Provider>
  );
}
