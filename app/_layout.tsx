import { useEffect } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { useAuthStore } from '../lib/store'
import { api, API_URL } from '../lib/api'

const queryClient = new QueryClient()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function registerPushToken() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'c207c9d3-c842-488b-8b50-fa37ab4aeea6',
    })
    await api.post('/notifications/token', { token: token.data })
  } catch (err) {
    console.log('Push token registration failed:', err)
  }
}

export default function RootLayout() {
  const hydrate = useAuthStore(s => s.hydrate)
  const token = useAuthStore(s => s.token)

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (token) {
      registerPushToken()
    }
  }, [token])

  const isStaging = API_URL.includes('staging')
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {isStaging && (
          <View style={styles.stagingBanner}>
            <Text style={styles.stagingText}>⚠️ Staging — use card 4242 4242 4242 4242</Text>
          </View>
        )}
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
const styles = StyleSheet.create({
  stagingBanner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingTop: 52,
  },
  stagingText: {
    color: '#000',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
})
