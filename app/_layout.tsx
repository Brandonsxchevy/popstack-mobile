import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../lib/store'
import { API_URL } from '../lib/api'

const queryClient = new QueryClient()

export default function RootLayout() {
  const hydrate = useAuthStore(s => s.hydrate)
  useEffect(() => {
    hydrate()
  }, [])

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
