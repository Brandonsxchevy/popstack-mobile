import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../lib/store'
import { api } from '../../lib/api'

export default function AccountScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user, clearAuth } = useAuthStore()

  const { data: retainers = [], isLoading: loadingRetainers } = useQuery({
    queryKey: ['my-retainers'],
    queryFn: () => api.get('/retainers/my').then(r => r.data),
  })

  const cancel = useMutation({
    mutationFn: (retainerId: string) => api.post(`/retainers/${retainerId}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-retainers'] }),
  })

  const handleLogout = async () => {
    await clearAuth()
    router.replace('/(auth)/login')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Retainers section */}
        <Text style={styles.sectionTitle}>Active Retainers</Text>
        {loadingRetainers ? (
          <ActivityIndicator size="small" color="#6C2FFF" style={{ marginBottom: 24 }} />
        ) : retainers.length === 0 ? (
          <View style={styles.emptyRetainers}>
            <Text style={styles.emptyRetainersText}>No active retainers</Text>
            <Text style={styles.emptyRetainersSub}>
              Subscribe to a developer's retainer from their profile for priority access.
            </Text>
          </View>
        ) : (
          <View style={styles.retainerList}>
            {retainers.map((r: any) => (
              <View key={r.id} style={styles.retainerCard}>
                <View style={styles.retainerLeft}>
                  <View style={styles.retainerAvatar}>
                    <Text style={styles.retainerAvatarText}>
                      {r.developer?.name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.retainerName}>{r.developer?.name || 'Developer'}</Text>
                    <Text style={styles.retainerPrice}>$300 / month</Text>
                    <View style={[styles.retainerBadge, r.status === 'ACTIVE' ? styles.retainerBadgeActive : styles.retainerBadgeCancelled]}>
                      <Text style={[styles.retainerBadgeText, r.status === 'ACTIVE' ? styles.retainerBadgeTextActive : styles.retainerBadgeTextCancelled]}>
                        {r.status === 'ACTIVE' ? 'Active' : r.status === 'CANCEL_AT_PERIOD_END' ? 'Cancels at period end' : r.status}
                      </Text>
                    </View>
                  </View>
                </View>
                {r.status === 'ACTIVE' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => cancel.mutate(r.id)}
                    disabled={cancel.isPending}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Log out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={styles.rowTextDanger}>Log out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  content: { padding: 20 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#E5E7EB', marginBottom: 24,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#6C2FFF' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyRetainers: {
    backgroundColor: '#fff', borderRadius: 14, padding: 20,
    borderWidth: 0.5, borderColor: '#E5E7EB', marginBottom: 24, alignItems: 'center',
  },
  emptyRetainersText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 6 },
  emptyRetainersSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  retainerList: { gap: 10, marginBottom: 24 },
  retainerCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  retainerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  retainerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  retainerAvatarText: { fontSize: 16, fontWeight: '700', color: '#6C2FFF' },
  retainerName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  retainerPrice: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  retainerBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  retainerBadgeActive: { backgroundColor: '#EAF3DE' },
  retainerBadgeCancelled: { backgroundColor: '#F3F4F6' },
  retainerBadgeText: { fontSize: 11, fontWeight: '600' },
  retainerBadgeTextActive: { color: '#27500A' },
  retainerBadgeTextCancelled: { color: '#6B7280' },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cancelBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#E5E7EB', overflow: 'hidden' },
  row: { paddingHorizontal: 16, paddingVertical: 16 },
  rowTextDanger: { fontSize: 15, color: '#EF4444' },
})
