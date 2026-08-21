import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1E293B' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'IA Coach',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="focus" options={{ title: 'Enfoque', tabBarIcon: ({ color }) => <IconSymbol size={28} name="timer" color={color} /> }} />
      <Tabs.Screen name="plans" options={{ title: 'Planes', tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historial', tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} /> }} />
      <Tabs.Screen name="plan-detail" options={{ href: null }} />
    </Tabs>
  );
}
