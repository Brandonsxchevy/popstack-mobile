import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../lib/store'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:            { label: 'Waiting for response', color: '#0C447C', bg: '#E6F1FB' },
  LOCKED:          { label: 'Response received',    color: '#633806', bg: '#FAEEDA' },
  AWAITING_ACCEPT: { label: 'Awaiting developer',   color: '#3C3489', bg: '#EEEDFE' },
  ACTIVE:          { label: 'Session active',        color: '#27500A', bg: '#EAF3DE' },
  ENDED:           { label: 'Review & approve',      color: '#712B13', bg: '#FAECE7' },
  CLOSED:          { label: 'Completed',             color: '#444441', bg: '#F1EFE8' },
  EXPIRED:         { label: 'Expired',               color: '#791F1F', bg: '#FCEBEB' },
}

export default function QuestionScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => api.get(`/questions/${id}`).then(r => r.data),
    refetchInterval: 10000,
  })

  const startSession = useMutation({
    mutationFn: () => api.post('/sessions/checkout', { questionId: id, tier: 'TWENTY' }),
    onSuccess: (res) => {
      Linking.openURL(res.data.checkoutUrl)
    },
  })

  const deleteQuestion = useMutation({
    mutationFn: () => api.delete(`/questions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-questions'] })
      router.replace('/(user)/dashboard')
    },
  })

  if (isLoading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#6C2FFF" /></View>
  )

  if (!question) return (
    <View style={styles.center}><Text style={styles.notFound}>Question not found</Text></View>
  )

  const response = question.responses?.[0]
  const config = STATUS_CONFIG[question.status] || STATUS_CONFIG.OPEN
  const isLocked = question.status === 'LOCKED'
  const isPendingAccept = question.status === 'AWAITING_ACCEPT'
  const isActive = question.status === 'ACTIVE'
  const isEnded = question.status === 'ENDED'
  const canDelete = ['OPEN', 'LOCKED'].includes(question.status)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Request</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>

        <Text style={styles.title}>{question.title}</Text>
        {question.description && <Text style={styles.description}>{question.description}</Text>}
        {question.url && (
          <TouchableOpacity onPress={() => Linking.openURL(question.url)}>
            <Text style={styles.url}>{question.url}</Text>
          </TouchableOpacity>
        )}

        {question.fingerprint?.platform && question.fingerprint.platform !== 'UNKNOWN' && (
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{question.fingerprint.platform}</Text>
          </View>
        )}

        {/* Dev response */}
        {response && (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseLabel}>🆓 Free diagnosis</Text>
              <Text style={styles.responseDev}>{response.developer.name}</Text>
            </View>
            {Array.isArray(response.blocks) && response.blocks.map((block: any, i: number) => (
              block.type === 'text' && (
                <Text key={i} style={styles.responseText}>
                  {typeof block.content === 'string' ? block.content : ''}
                </Text>
              )
            ))}
            {response.offerPriceCents && (
              <Text style={styles.offer}>
                Offer: ${(response.offerPriceCents / 100).toFixed(2)}
                {response.offerTimeMinutes ? ` · ${response.offerTimeMinutes} min` : ''}
                {response.effortEstimate ? ` · ${response.effortEstimate}` : ''}
              </Text>
            )}
          </View>
        )}

        {/* Pay to start session */}
        {isLocked && response && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => startSession.mutate()}
            disabled={startSession.isPending}>
            {startSession.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.payBtnText}>
                  Pay ${response.offerPriceCents ? (response.offerPriceCents / 100).toFixed(2) : '30.00'} & start session →
                </Text>}
          </TouchableOpacity>
        )}

        {/* Awaiting accept */}
        {isPendingAccept && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingEmoji}>⏳</Text>
            <Text style={styles.pendingTitle}>Payment received!</Text>
            <Text style={styles.pendingDesc}>Waiting for {response?.developer?.name || 'your developer'} to accept.</Text>
            {question.thread?.id && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => router.push({ pathname: '/threads/[id]', params: { id: question.thread.id } })}>
                <Text style={styles.chatBtnText}>💬 Open chat</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Active session */}
        {isActive && question.thread?.id && (
          <TouchableOpacity
            style={styles.activeBtn}
            onPress={() => router.push({ pathname: '/threads/[id]', params: { id: question.thread.id } })}>
            <Text style={styles.activeBtnText}>⚡ Open session chat →</Text>
          </TouchableOpacity>
        )}

        {/* Ended - approve */}
        {isEnded && question.thread?.id && (
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => router.push({ pathname: '/threads/[id]', params: { id: question.thread.id } })}>
            <Text style={styles.approveBtnText}>✅ Review & approve payment →</Text>
          </TouchableOpacity>
        )}

        {/* Waiting for response */}
        {question.status === 'OPEN' && !response && (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingEmoji}>👀</Text>
            <Text style={styles.waitingTitle}>Waiting for a Stacker</Text>
            <Text style={styles.waitingDesc}>A developer will send a free diagnosis soon.</Text>
          </View>
        )}

        {/* Delete */}
        {canDelete && question.userId === user?.id && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteQuestion.mutate()}
            disabled={deleteQuestion.isPending}>
            <Text style={styles.deleteBtnText}>
              {deleteQuestion.isPending ? 'Deleting...' : 'Delete this request'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: '#9CA3AF', fontSize: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  back: { fontSize: 13, color: '#6C2FFF', fontWeight: '500', width: 60 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'center' },
  content: { padding: 20, gap: 16 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', lineHeight: 28 },
  description: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  url: { fontSize: 13, color: '#6C2FFF', textDecorationLine: 'underline' },
  platformBadge: { alignSelf: 'flex-start', backgroundColor: '#EEEDFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  platformText: { fontSize: 12, color: '#6C2FFF', fontWeight: '500' },
  responseCard: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  responseLabel: { fontSize: 12, fontWeight: '600', color: '#166534' },
  responseDev: { fontSize: 12, color: '#6B7280' },
  responseText: { fontSize: 14, color: '#111827', lineHeight: 22, marginBottom: 8 },
  offer: { fontSize: 12, color: '#6B7280', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#D1FAE5' },
  payBtn: {
    backgroundColor: '#6C2FFF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  pendingCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  pendingEmoji: { fontSize: 32, marginBottom: 8 },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  pendingDesc: { fontSize: 13, color: '#B45309', textAlign: 'center', marginBottom: 12 },
  chatBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  chatBtnText: { color: '#fff', fontWeight: '600' },
  activeBtn: { backgroundColor: '#6C2FFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  activeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  approveBtn: { backgroundColor: '#D85A30', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  waitingCard: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: '#E5E7EB' },
  waitingEmoji: { fontSize: 40, marginBottom: 12 },
  waitingTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  waitingDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  deleteBtn: { alignItems: 'center', paddingVertical: 16 },
  deleteBtnText: { fontSize: 14, color: '#EF4444' },
})
