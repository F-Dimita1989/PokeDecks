import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#FF4444',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#0D0D1A',
          borderTopColor: 'rgba(255,255,255,0.06)',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="camera.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="rectangle.stack.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
