import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../lib/store'
import { api } from '../../lib/api'

export default function LoginScreen() {
  const router = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user } = res.data
      await setAuth(accessToken, refreshToken, user)
      if (user.role === 'DEVELOPER') {
        router.replace('/(dev)/swipe')
      } else {
        router.replace('/(user)/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>PopStack</Text>
        <Text style={styles.tagline}>Real developers. Real fast.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ marginBottom: 12 }}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://app.popstack.dev/discover')} style={{ marginTop: 16 }}>
          <Text style={styles.browse}>Browse developers without signing up →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 32, fontWeight: '700', color: '#6C2FFF', textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 40 },
  error: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#111827', marginBottom: 12,
  },
  button: {
    backgroundColor: '#6C2FFF', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  link: { color: '#6C2FFF', textAlign: 'center', fontSize: 14 },
  browse: { color: '#9CA3AF', textAlign: 'center', fontSize: 13, marginTop: 4 },
})