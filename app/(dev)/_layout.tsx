import { Tabs } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function DevLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6C2FFF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 8, height: 60 },
      }}>
        <Tabs.Screen name="swipe" options={{ title: 'Feed', tabBarLabel: '🔥 Feed' }} />
        <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarLabel: '📥 Inbox' }} />
        <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarLabel: '💰 Earnings' }} />
        <Tabs.Screen name="respond" options={{ href: null }} />
      </Tabs>
    </QueryClientProvider>
  )
}
