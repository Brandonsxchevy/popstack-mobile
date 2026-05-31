import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:            { label: 'Waiting for response', color: '#0C447C', bg: '#E6F1FB' },
  LOCKED:          { label: 'Response received',    color: '#633806', bg: '#FAEEDA' },
  AWAITING_ACCEPT: { label: 'Awaiting developer',   color: '#3C3489', bg: '#EEEDFE' },
  ACTIVE:          { label: 'Session active',        color: '#27500A', bg: '#EAF3DE' },
  ENDED:           { label: 'Review & approve',      color: '#712B13', bg: '#FAECE7' },
  CLOSED:          { label: 'Completed',             color: '#444441', bg: '#F1EFE8' },
  EXPIRED:         { label: 'Expired',               color: '#791F1F', bg: '#FCEBEB' },
}

const STATUS_ORDER = ['ENDED', 'ACTIVE', 'AWAITING_ACCEPT', 'LOCKED', 'OPEN', 'CLOSED', 'EXPIRED']

function QuestionCard({ q }: { q: any }) {
  const router = useRouter()
  const sessionEnded = q.thread?.session?.status === 'ENDED'
  const effectiveStatus = sessionEnded && !['CLOSED', 'EXPIRED'].includes(q.status) ? 'ENDED' : q.status
  const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.OPEN
  const isActive = effectiveStatus === 'ACTIVE'
  const isEnded = effectiveStatus === 'ENDED'
  const isCompleted = ['CLOSED', 'EXPIRED'].includes(effectiveStatus)

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive, isEnded && styles.cardEnded]}
      onPress={() => router.push({ pathname: '/question/[id]', params: { id: q.id } })}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        {isActive && <View style={styles.activeDot} />}
      </View>
      <Text style={[styles.cardTitle, isCompleted && styles.cardTitleDim]} numberOfLines={2}>
        {q.title}
      </Text>
      {q.url && <Text style={styles.cardUrl} numberOfLines={1}>{q.url}</Text>}
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>
          {new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {isEnded && q.thread?.id && (
          <TouchableOpacity style={styles.approveBtn} onPress={() => router.push({ pathname: '/threads/[id]', params: { id: q.thread.id } })}>
            <Text style={styles.approveBtnText}>Approve & pay →</Text>
          </TouchableOpacity>
        )}
        {isActive && q.thread?.id && (
          <TouchableOpacity style={styles.chatBtn} onPress={() => router.push({ pathname: '/threads/[id]', params: { id: q.thread.id } })}>
            <Text style={styles.chatBtnText}>Open chat →</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const { data: questions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-questions'],
    queryFn: () => api.get('/questions/my').then(r => r.data),
    refetchInterval: 15000,
    staleTime: 0,
  })

  const sorted = [...questions].sort((a: any, b: any) =>
    STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )

  const ended = questions.filter((q: any) =>
    (q.status === 'ENDED' || q.thread?.session?.status === 'ENDED') &&
    !['CLOSED', 'EXPIRED'].includes(q.status)
  )

  if (isLoading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#6C2FFF" /></View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(user)/ask')}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {ended.length > 0 && (
        <TouchableOpacity
          style={styles.approvalBanner}
          onPress={() => router.push({ pathname: '/threads/[id]', params: { id: ended[0]?.thread?.id } })}>
          <Text style={styles.approvalEmoji}>⏳</Text>
          <View style={styles.approvalText}>
            <Text style={styles.approvalTitle}>
              {ended.length === 1 ? 'Work ready to approve' : `${ended.length} sessions to approve`}
            </Text>
            <Text style={styles.approvalSub}>Auto-releases in 24 hours</Text>
          </View>
          <Text style={styles.approvalArrow}>→</Text>
        </TouchableOpacity>
      )}

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧩</Text>
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptySub}>Got a tech problem? Pop it and a Stacker will help.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(user)/ask')}>
            <Text style={styles.emptyBtnText}>Submit your first request</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={q => q.id}
          renderItem={({ item }) => <QuestionCard q={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C2FFF" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  newBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  approvalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, padding: 16, backgroundColor: '#FEF3EE',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#F0997B',
  },
  approvalEmoji: { fontSize: 22 },
  approvalText: { flex: 1 },
  approvalTitle: { fontSize: 14, fontWeight: '600', color: '#712B13' },
  approvalSub: { fontSize: 12, color: '#D85A30', marginTop: 2 },
  approvalArrow: { fontSize: 16, color: '#D85A30', fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardActive: { borderColor: '#97C459', borderWidth: 1.5 },
  cardEnded: { borderColor: '#F0997B', borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#639922' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 6, lineHeight: 22 },
  cardTitleDim: { color: '#9CA3AF' },
  cardUrl: { fontSize: 12, color: '#6C2FFF', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { fontSize: 12, color: '#9CA3AF' },
  approveBtn: { backgroundColor: '#D85A30', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  chatBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  chatBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
