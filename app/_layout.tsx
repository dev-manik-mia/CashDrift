import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { setupI18n } from '../i18n';
import { Colors } from '../constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { theme, loadInitialData, isLoaded } = useStore();
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    setupI18n().then(() => setI18nLoaded(true));
    loadInitialData();
  }, []);

  if (!isLoaded || !i18nLoaded) return null;

  const appTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: Colors.dark.border,
      primary: Colors.dark.tint
    }
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
      primary: Colors.light.tint
    }
  };

  return (
    <ThemeProvider value={appTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* @ts-ignore */}
        <Stack.Screen name="modal" options={{ presentation: 'transparentModal', headerShown: false }} />
        {/* @ts-ignore */}
        <Stack.Screen name="voice-modal" options={{ presentation: 'transparentModal', headerShown: false }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
