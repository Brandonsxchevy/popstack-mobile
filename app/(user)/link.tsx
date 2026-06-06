import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function LinkScreen() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolve = async () => {
    setError('')
    const trimmed = input.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      // Check for dev profile URL: /dev/username
      const profileMatch = trimmed.match(/\/dev\/([a-zA-Z0-9_-]+)/)
      if (profileMatch) {
        const username = profileMatch[1]
        const res = await api.get(`/profiles/${username}`)
        const dev = res.data
        router.push({
          pathname: '/(user)/ask',
          params: {
            prefillTitle: '',
            prefillUrl: '',
            prefillBudget: 'FIFTEEN_MIN',
            devId: dev.id,
          },
        })
        return
      }

      // Extract shortcode from full URL or bare shortcode
      const match = trimmed.match(/\/r\/([a-zA-Z0-9]+)/) || trimmed.match(/^([a-zA-Z0-9]+)$/)
      if (!match) {
        setError('Invalid link — paste a full PopStack link or shortcode')
        return
      }

      const shortcode = match[1]
      const res = await api.get(`/r/${shortcode}`)
      const link = res.data
      router.push({
        pathname: '/(user)/ask',
        params: {
          prefillTitle: link.customHeadline || '',
          prefillUrl: '',
          prefillBudget: link.tier || 'TWENTY',
          devId: link.developer?.id,
        },
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Link not found or inactive')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Use a Dev Link</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🔗</Text>
        </View>
        <Text style={styles.title}>Got a link from a developer?</Text>
        <Text style={styles.subtitle}>
          Paste their PopStack link below. We'll pre-fill your request and send it directly to them.
        </Text>
        <Text style={styles.label}>Paste link or shortcode</Text>
        <TextInput
          style={styles.input}
          placeholder="app.popstack.dev/r/abc123 or /dev/username"
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={t => { setInput(t); setError('') }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.btn, (!input.trim() || loading) && styles.btnDisabled]}
          onPress={resolve}
          disabled={!input.trim() || loading}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.btnText}>Continue →</Text>}
        </TouchableOpacity>
        <Text style={styles.hint}>
          Links look like{' '}
          <Text style={styles.hintCode}>app.popstack.dev/r/abc123</Text>
          {' '}or{' '}
          <Text style={styles.hintCode}>app.popstack.dev/dev/username</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  content: { flex: 1, padding: 24 },
  iconWrap: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: '#111827', marginBottom: 8,
  },
  error: { fontSize: 13, color: '#EF4444', marginBottom: 12 },
  btn: {
    backgroundColor: '#6C2FFF', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  btnDisabled: { backgroundColor: '#C4B5FD' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  hintCode: { color: '#6C2FFF' },
})
