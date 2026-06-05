import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function UserLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6C2FFF',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        borderTopWidth: 0.5,
        borderTopColor: '#E5E7EB',
        paddingBottom: insets.bottom || 8,
        paddingTop: 8,
        height: 52 + (insets.bottom || 8),
      },
    }}>
      <Tabs.Screen name="dashboard" options={{
        title: 'Requests',
        tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="ask" options={{
        title: 'New',
        tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="link" options={{
        title: 'Link',
        tabBarIcon: ({ color, size }) => <Ionicons name="link-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="support" options={{
        title: 'Support',
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="account" options={{
        title: 'Account',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  )
}
