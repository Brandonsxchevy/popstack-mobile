import { Tabs } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { View, Text, StyleSheet } from 'react-native'

const queryClient = new QueryClient()

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function DevLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 4 },
      }}>
        <Tabs.Screen name="swipe" options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" label="Feed" focused={focused} />
        }} />
        <Tabs.Screen name="active" options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" label="Active" focused={focused} />
        }} />
        <Tabs.Screen name="inbox" options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📥" label="Inbox" focused={focused} />
        }} />
        <Tabs.Screen name="earnings" options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Earnings" focused={focused} />
        }} />
        <Tabs.Screen name="profile" options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />
        }} />
        <Tabs.Screen name="links" options={{ href: null }} />
        <Tabs.Screen name="support" options={{ href: null }} />
        <Tabs.Screen name="respond" options={{ href: null }} />
      </Tabs>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive: { color: '#6C2FFF' },
})
