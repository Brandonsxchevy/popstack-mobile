import { Redirect } from 'expo-router'
import { useAuthStore } from '../lib/store'

export default function Index() {
  const { user, token } = useAuthStore()

  if (!token) return <Redirect href="/(auth)/login" />
  if (user?.role === 'DEVELOPER') return <Redirect href="/(dev)/swipe" />
  return <Redirect href="/(user)/dashboard" />
}