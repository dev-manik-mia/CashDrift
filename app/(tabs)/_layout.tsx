import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export default function TabLayout() {
  const { theme } = useStore();
  const { t } = useTranslation();
  const currentTheme = Colors[theme];
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: currentTheme.tint,
          tabBarInactiveTintColor: currentTheme.tabIconDefault,
          tabBarStyle: {
            backgroundColor: currentTheme.card,
            borderTopColor: currentTheme.border,
          },
          headerStyle: { backgroundColor: currentTheme.card },
          headerTintColor: currentTheme.text,
          headerTitleStyle: { fontWeight: 'bold' },
          tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> }} />
        <Tabs.Screen name="transactions" options={{ title: t('transactions'), tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} /> }} />
        <Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} /> }} />
      </Tabs>

      {/* Simplified FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/modal')}>
          <View style={[styles.fabMain, { backgroundColor: currentTheme.tint }]}>
            <IconSymbol name="plus" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 80, 
    right: 24,
    alignItems: 'center',
    zIndex: 999,
  },
  fabMain: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8
  }
});
