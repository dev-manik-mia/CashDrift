import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { HapticTab } from '../../components/haptic-tab';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export default function TabLayout() {
  const { theme } = useStore();
  const { t } = useTranslation();
  const currentTheme = Colors[theme];
  
  const [fabOpen, setFabOpen] = useState(false);

  const toggleFab = () => setFabOpen(!fabOpen);

  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withSpring(fabOpen ? '45deg' : '0deg') }]
    };
  });

  const option1Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(fabOpen ? -60 : 0) }],
      opacity: withTiming(fabOpen ? 1 : 0),
    };
  });

  const option2Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(fabOpen ? -120 : 0) }],
      opacity: withTiming(fabOpen ? 1 : 0),
    };
  });

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

      {/* Global Speed Dial FAB */}
      <View style={styles.fabContainer}>
        {/* Voice Option */}
        <Animated.View style={[styles.fabOptionContainer, option2Style]}>
          <Text style={[styles.fabLabel, { color: currentTheme.text }]}>Voice</Text>
          <TouchableOpacity 
            style={[styles.fabSmall, { backgroundColor: currentTheme.income }]} 
            onPress={() => { setFabOpen(false); router.push('/voice-modal'); }}
            disabled={!fabOpen}
          >
            <Text style={{ fontSize: 24 }}>🎙️</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Form Option */}
        <Animated.View style={[styles.fabOptionContainer, option1Style]}>
          <Text style={[styles.fabLabel, { color: currentTheme.text }]}>Form</Text>
          <TouchableOpacity 
            style={[styles.fabSmall, { backgroundColor: currentTheme.expense }]} 
            onPress={() => { setFabOpen(false); router.push('/modal'); }}
            disabled={!fabOpen}
          >
            <Text style={{ fontSize: 24 }}>📝</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <TouchableOpacity activeOpacity={0.8} onPress={toggleFab}>
          <Animated.View style={[styles.fabMain, { backgroundColor: currentTheme.tint }, fabStyle]}>
            <IconSymbol name="plus" size={32} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 80, // floats right above the tab bar, usually bottom 50-80
    right: 24,
    alignItems: 'center',
    zIndex: 999,
  },
  fabMain: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8
  },
  fabOptionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 5,
  },
  fabSmall: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5
  },
  fabLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});
