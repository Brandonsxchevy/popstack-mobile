import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function ActiveScreen() {
  const router = useRouter()

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['dev-active'],
    queryFn: () => api.get('/inbox').then(r => r.data.filter((t: any) => t.devSection === 'ACTIVE_WORK')),
    refetchInterval: 10000,
  })

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C2FFF" /></View>

  if (threads.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.emptyEmoji}>⚡</Text>
      <Text style={styles.emptyTitle}>No active sessions</Text>
      <Text style={styles.emptySubtitle}>Accept a session from your inbox to get started.</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active</Text>
        <View style={styles.activeDot} />
      </View>
      <FlatList
        data={threads}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: thread }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/threads/${thread.id}` as any)}>
            <View style={styles.pulseRow}>
              <View style={styles.pulse} />
              <Text style={styles.activeLabel}>Active session</Text>
              {thread.devUnreadCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{thread.devUnreadCount}</Text></View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>{thread.question?.title || 'Untitled'}</Text>
            {thread.lastMessagePreview && (
              <Text style={styles.preview} numberOfLines={1}>{thread.lastMessagePreview}</Text>
            )}
            <View style={styles.meta}>
              {thread.question?.fingerprint?.platform && thread.question.fingerprint.platform !== 'UNKNOWN' && (
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>{thread.question.fingerprint.platform}</Text>
                </View>
              )}
              <Text style={styles.userName}>{thread.user?.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#639922' },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#97C459' },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#639922' },
  activeLabel: { fontSize: 11, fontWeight: '600', color: '#639922', flex: 1 },
  badge: { backgroundColor: '#6C2FFF', borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  preview: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platformBadge: { backgroundColor: '#EEEDFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  platformText: { fontSize: 11, color: '#6C2FFF', fontWeight: '500' },
  userName: { fontSize: 12, color: '#9CA3AF' },
})
