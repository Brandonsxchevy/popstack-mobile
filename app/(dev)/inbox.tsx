import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

const SECTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW_REQUESTS:     { label: 'New request',        color: '#0C447C', bg: '#E6F1FB' },
  AWAITING_PAYMENT: { label: 'Pending acceptance',  color: '#633806', bg: '#FAEEDA' },
  BLOCKED:          { label: 'Blocked',             color: '#712B13', bg: '#FAECE7' },
  COMPLETED:        { label: 'Completed',           color: '#444441', bg: '#F1EFE8' },
}

const TIER_LABELS: Record<string, string> = {
  FIVE: '$7.50', TWENTY: '$30', FIFTY_PLUS: '$75+',
  QUICK_FOLLOWUP: '$7.50', FIFTEEN_MIN: '$30', FULL_SOLUTION: '$75+',
}

export default function InboxScreen() {
  const router = useRouter()

  const { data: allThreads = [], isLoading } = useQuery({
    queryKey: ['dev-inbox'],
    queryFn: () => api.get('/inbox').then(r => r.data),
    refetchInterval: 10000,
  })

  const threads = allThreads.filter((t: any) => t.devSection !== 'ACTIVE_WORK')

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C2FFF" /></View>

  if (threads.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyTitle}>Inbox is empty</Text>
      <Text style={styles.emptySubtitle}>Respond to questions from the feed to get started.</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
      </View>
      <FlatList
        data={threads}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: thread }) => {
          const config = SECTION_CONFIG[thread.devSection] || SECTION_CONFIG.NEW_REQUESTS
          const price = TIER_LABELS[thread.session?.tier] || (thread.session?.amountCents ? `$${(thread.session.amountCents/100).toFixed(2)}` : null)
          const platform = thread.question?.fingerprint?.platform
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/threads/${thread.id}` as any)}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{thread.question?.title || 'Untitled request'}</Text>
                <View style={styles.cardRight}>
                  {price && <Text style={styles.price}>{price}</Text>}
                  {thread.devUnreadCount > 0 && (
                    <View style={styles.badge}><Text style={styles.badgeText}>{thread.devUnreadCount}</Text></View>
                  )}
                </View>
              </View>
              {thread.lastMessagePreview && (
                <Text style={styles.preview} numberOfLines={1}>{thread.lastMessagePreview}</Text>
              )}
              <View style={styles.cardBottom}>
                {platform && platform !== 'UNKNOWN' && (
                  <View style={styles.platformBadge}>
                    <Text style={styles.platformText}>{platform}</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                </View>
                {thread.lastMessageAt && (
                  <Text style={styles.date}>{new Date(thread.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 14, fontWeight: '700', color: '#6C2FFF' },
  badge: { backgroundColor: '#6C2FFF', borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  preview: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  platformBadge: { backgroundColor: '#EEEDFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  platformText: { fontSize: 11, color: '#6C2FFF', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '500' },
  date: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
})
