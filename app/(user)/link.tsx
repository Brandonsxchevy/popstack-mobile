import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { api, API_URL } from '../../lib/api'
import { useAuthStore } from '../../lib/store'

export default function LinkScreen() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devProfile, setDevProfile] = useState<any>(null)
  const [subscribing, setSubscribing] = useState(false)

  const resolve = async () => {
    setError('')
    setDevProfile(null)
    const trimmed = input.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      // Check for dev profile URL: /dev/username
      const profileMatch = trimmed.match(/\/dev\/([a-zA-Z0-9_-]+)/)
      if (profileMatch) {
        const username = profileMatch[1]
        const res = await api.get(`/profiles/${username}`)
        setDevProfile(res.data)
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
          prefillBudget: link.tier || 'FIFTEEN_MIN',
          devId: link.developer?.id,
        },
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Link not found or inactive')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!devProfile) return
    setSubscribing(true)
    try {
      const res = await api.post(`/retainers/subscribe/${devProfile.id}`, { promoCode: promoCode.trim() || undefined })
      if (res.data.checkoutUrl) {
        Linking.openURL(res.data.checkoutUrl)
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to start subscription')
    } finally {
      setSubscribing(false)
    }
  }

  const handleAsk = () => {
    if (!devProfile) return
    router.push({
      pathname: '/(user)/ask',
      params: {
        prefillTitle: '',
        prefillUrl: '',
        prefillBudget: 'FIFTEEN_MIN',
        devId: devProfile.id,
      },
    })
  }

  if (devProfile) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setDevProfile(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Developer Profile</Text>
        </View>
        <View style={styles.profileCard}>
          {devProfile.avatarUrl ? (
            <Image source={{ uri: devProfile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{devProfile.name?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.devName}>{devProfile.name}</Text>
          {devProfile.profile?.bio && (
            <Text style={styles.devBio}>{devProfile.profile.bio}</Text>
          )}
          {devProfile.avgRating && (
            <Text style={styles.devRating}>⭐ {devProfile.avgRating.toFixed(1)}</Text>
          )}
        </View>

        {devProfile.profile?.retainerEnabled && (
          <View style={styles.retainerCard}>
            <Text style={styles.retainerTitle}>⚡ Priority Access</Text>
            <Text style={styles.retainerPrice}>
              ${(devProfile.profile?.monthlyPriceCents ? (devProfile.profile.monthlyPriceCents / 100).toFixed(0) : 300)}/mo
            </Text>
            {devProfile.profile.slaHours && (
              <Text style={styles.retainerDetail}>{devProfile.profile.slaHours}h response SLA</Text>
            )}
            {devProfile.profile.discountPct > 0 && (
              <Text style={styles.retainerDiscount}>{devProfile.profile.discountPct}% off all sessions</Text>
            )}
            <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe} disabled={subscribing}>
              {subscribing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.subscribeBtnText}>Subscribe · ${(devProfile.profile?.monthlyPriceCents ? (devProfile.profile.monthlyPriceCents / 100).toFixed(0) : 300)}/mo</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.askBtn} onPress={handleAsk}>
            <Text style={styles.askBtnText}>Ask a question →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { fontSize: 14, color: '#6C2FFF', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
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
  profileCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, alignItems: 'center',
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEEDFE',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#6C2FFF' },
  devName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 6 },
  devBio: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  devRating: { fontSize: 14, color: '#F59E0B', fontWeight: '600' },
  retainerCard: {
    backgroundColor: '#EEEDFE', margin: 16, marginTop: 0, borderRadius: 16, padding: 20,
  },
  retainerTitle: { fontSize: 15, fontWeight: '700', color: '#4C1D95', marginBottom: 4 },
  retainerPrice: { fontSize: 24, fontWeight: '800', color: '#6C2FFF', marginBottom: 4 },
  retainerDetail: { fontSize: 13, color: '#5B21B6', marginBottom: 2 },
  retainerDiscount: { fontSize: 13, color: '#16a34a', fontWeight: '500', marginBottom: 12 },
  subscribeBtn: {
    backgroundColor: '#6C2FFF', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', marginTop: 8,
  },
  subscribeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionsCard: { margin: 16, marginTop: 0 },
  askBtn: {
    borderWidth: 1.5, borderColor: '#6C2FFF', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  askBtnText: { color: '#6C2FFF', fontWeight: '700', fontSize: 15 },
})
