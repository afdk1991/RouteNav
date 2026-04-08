import { AuthProvider } from '@/contexts/AuthContext';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebOnlyColorSchemeUpdater } from './ColorSchemeUpdater';
import { HeroUINativeProvider } from '@/heroui';

function Provider({ children }: { children: ReactNode }) {
  return <WebOnlyColorSchemeUpdater>
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider>
          {children}
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  </WebOnlyColorSchemeUpdater>
}

export {
  Provider,
}
