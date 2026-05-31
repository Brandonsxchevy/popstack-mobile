import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function RegisterScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'USER' | 'DEVELOPER'>('USER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', { name, email, password, role })
      router.replace('/(auth)/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>PopStack</Text>
        <Text style={styles.tagline}>Real developers. Real fast.</Text>

        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'USER' && styles.roleBtnActive]}
            onPress={() => setRole('USER')}>
            <Text style={[styles.roleBtnText, role === 'USER' && styles.roleBtnTextActive]}>I need help</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'DEVELOPER' && styles.roleBtnActive]}
            onPress={() => setRole('DEVELOPER')}>
            <Text style={[styles.roleBtnText, role === 'DEVELOPER' && styles.roleBtnTextActive]}>I fix problems</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          autoComplete="username"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 chars)"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logo: { fontSize: 32, fontWeight: '700', color: '#6C2FFF', textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  roleBtnActive: { borderColor: '#6C2FFF', backgroundColor: '#EEEDFE' },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  roleBtnTextActive: { color: '#6C2FFF' },
  error: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  button: { backgroundColor: '#6C2FFF', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  link: { color: '#6C2FFF', textAlign: 'center', fontSize: 14 },
})
