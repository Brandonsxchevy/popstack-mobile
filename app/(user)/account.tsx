import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../lib/store'

const TABS = ['Profile', 'Retainers', 'Security']

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
]

export default function AccountScreen() {
  const { user, clearAuth, setUser } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState('Profile')
  const [name, setName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { data: retainers = [], isLoading: retainersLoading } = useQuery({
    queryKey: ['my-retainers'],
    queryFn: () => api.get('/retainers/mine').then(r => r.data),
    enabled: tab === 'Retainers',
  })

  const updateProfile = useMutation({
    mutationFn: () => api.patch('/profiles/me', { name }),
    onSuccess: () => Alert.alert('Success', 'Profile updated!'),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to update'),
  })

  const changePassword = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword, newPassword }),
    onSuccess: () => {
      Alert.alert('Success', 'Password changed!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  })

  const cancelRetainer = useMutation({
    mutationFn: (id: string) => api.delete(`/retainers/${id}`),
    onSuccess: () => {
      Alert.alert('Cancelled', 'Retainer cancelled — access continues until end of billing period')
      qc.invalidateQueries({ queryKey: ['my-retainers'] })
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  })

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return }
    if (newPassword.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return }
    changePassword.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.title}>Account</Text>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Profile Tab */}
      {tab === 'Profile' && (
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.userName}>{user?.name}</Text>
          <Text style={s.userEmail}>{user?.email}</Text>
          <Text style={s.userRole}>{user?.role === 'USER' ? 'Popper' : 'Stacker'}</Text>

          <Text style={s.label}>Display name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" />

          <TouchableOpacity style={s.btn} onPress={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
            <Text style={s.btnText}>{updateProfile.isPending ? 'Saving...' : 'Save changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.dangerBtn} onPress={async () => { await clearAuth(); router.replace('/(auth)/login') }}>
            <Text style={s.dangerText}>Log out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Retainers Tab */}
      {tab === 'Retainers' && (
        <View>
          {retainersLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#6C2FFF" />
          ) : retainers.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>⚡</Text>
              <Text style={s.emptyTitle}>No active retainers</Text>
              <Text style={s.emptyDesc}>Subscribe to a developer's priority access from their profile</Text>
            </View>
          ) : (
            retainers.map((r: any) => (
              <View key={r.id} style={s.card}>
                <View style={s.retainerRow}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{r.developer?.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.userName}>{r.developer?.name}</Text>
                    <Text style={s.userEmail}>${(r.monthlyPriceCents / 100).toFixed(0)}/mo · {r.slaHours}h SLA</Text>
                    {r.discountPct > 0 && <Text style={{ fontSize: 12, color: '#16a34a' }}>{r.discountPct}% off sessions</Text>}
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Cancel retainer?', 'You\'ll keep access until end of billing period.', [
                    { text: 'No' },
                    { text: 'Cancel', style: 'destructive', onPress: () => cancelRetainer.mutate(r.id) }
                  ])}>
                    <Text style={{ fontSize: 12, color: '#ef4444' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.userEmail}>Renews {new Date(r.nextRenewalAt).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Security Tab */}
      {tab === 'Security' && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Change password</Text>
          <Text style={s.label}>Current password</Text>
          <TextInput style={s.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Current password" />
          <Text style={s.label}>New password</Text>
          <TextInput style={s.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Min 8 characters" />
          <Text style={s.label}>Confirm new password</Text>
          <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat new password" />
          <TouchableOpacity style={s.btn} onPress={handlePasswordChange} disabled={changePassword.isPending}>
            <Text style={s.btnText}>{changePassword.isPending ? 'Changing...' : 'Change password'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16, marginTop: 8 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#6C2FFF' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#6C2FFF' },
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  userRole: { fontSize: 11, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start', marginTop: 4, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 10, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  btn: { backgroundColor: '#6C2FFF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dangerBtn: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  dangerText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  retainerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptyDesc: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
})
