import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, fontWeights } from '../../constants/theme';
import { AuthStateView } from '../../components/auth/AuthStateView';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  const { session, loading, authError, clearAuthError } = useAuth();

  if (loading) {
    return <AuthStateView />;
  }

  if (authError) {
    return (
      <AuthStateView
        title="No pudimos verificar tu sesión"
        message={getAuthErrorMessage(new Error(authError))}
        actionLabel="Volver a intentar"
        onAction={clearAuthError}
        loading={false}
      />
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          height: 80,
          ...styles.tabBarShadow,
        },
        tabBarLabelStyle: {
          ...typography.xs,
          fontWeight: fontWeights.medium,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ia-coach"
        options={{
          title: 'IA Coach',
          tabBarIcon: ({ focused, color }) => (
            <MaterialCommunityIcons name={focused ? 'robot' : 'robot-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Enfoque',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'timer' : 'timer-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = {
  tabBarShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
