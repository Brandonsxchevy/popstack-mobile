import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../lib/store'

const TIER_LABELS: Record<string, string> = {
  FIVE: '$7.50', TWENTY: '$30', FIFTY_PLUS: '$75+',
  QUICK_FOLLOWUP: '$7.50', FIFTEEN_MIN: '$30', FULL_SOLUTION: '$75+',
}

export default function ThreadScreen() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [contextOpen, setContextOpen] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const listRef = useRef<FlatList>(null)

  const isDev = user?.role === 'DEVELOPER'

  const { data: thread } = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get(`/threads/${id}`).then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: session } = useQuery({
    queryKey: ['session', thread?.sessionId],
    queryFn: () => api.get(`/sessions/${thread.sessionId}`).then(r => r.data),
    enabled: !!thread?.sessionId,
    refetchInterval: 5000,
  })

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => api.get(`/threads/${id}/messages`).then(r => r.data),
    refetchInterval: 5000,
  })

  const send = useMutation({
    mutationFn: () => api.post(`/threads/${id}/messages`, {
      blocks: [{ type: 'text', content: text.trim() }],
      type: 'PAID_MESSAGE',
    }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['messages', id] })
    },
  })

  const approve = useMutation({
    mutationFn: () => api.post(`/sessions/${thread.sessionId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', thread?.sessionId] })
      qc.invalidateQueries({ queryKey: ['thread', id] })
    },
  })

  const complete = useMutation({
    mutationFn: () => api.post(`/sessions/${thread.sessionId}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', thread?.sessionId] }),
  })

  const getSummary = async () => {
    if (summary) { setSummary(null); return }
    setLoadingSummary(true)
    try {
      const res = await api.post(`/questions/${thread.question.id}/summary`)
      setSummary(res.data.summary || 'Could not generate summary')
    } catch {
      setSummary('Failed to generate summary')
    } finally {
      setLoadingSummary(false)
    }
  }

  const getMessageText = (msg: any) => {
    if (!Array.isArray(msg.blocks)) return ''
    return msg.blocks.filter((b: any) => b.type === 'text').map((b: any) =>
      typeof b.content === 'string' ? b.content : ''
    ).join(' ')
  }

  const question = thread?.question
  const otherPerson = isDev ? thread?.user : thread?.developer
  const isActive = session?.status === 'ACTIVE'
  const isEnded = session?.status === 'ENDED'
  const isPending = session?.status === 'PENDING_ACCEPT'
  const price = session?.amountCents
    ? `$${(session.amountCents / 100).toFixed(2)}`
    : TIER_LABELS[session?.tier] || null

  return (
    <KeyboardAvoidingView 
  style={styles.container} 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {/* Nav */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← {isDev ? 'Inbox' : 'Dashboard'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{question?.title || 'Thread'}</Text>
          <Text style={styles.headerStatus}>
            {isActive ? '🟢 Active' : isEnded ? '✅ Ended' : isPending ? '⏳ Pending' : 'Thread'}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Context Panel */}
      <View style={styles.contextPanel}>
        <TouchableOpacity style={styles.contextToggle} onPress={() => setContextOpen(!contextOpen)}>
          <View style={styles.contextPerson}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{otherPerson?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View>
              <Text style={styles.personName}>{otherPerson?.name || 'Unknown'}</Text>
              {otherPerson?.avgRating && (
                <Text style={styles.personRating}>★ {otherPerson.avgRating.toFixed(1)}</Text>
              )}
            </View>
          </View>
          <View style={styles.contextRight}>
            {price && <View style={styles.priceBadge}><Text style={styles.priceText}>{price}</Text></View>}
            <Text style={styles.chevron}>{contextOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {contextOpen && question && (
          <View style={styles.contextBody}>
            <Text style={styles.contextQuestion}>{question.title}</Text>
            {question.description && (
              <Text style={styles.contextDesc} numberOfLines={3}>{question.description}</Text>
            )}
            {question.url && (
              <Text style={styles.contextUrl} numberOfLines={1}>{question.url}</Text>
            )}
            <View style={styles.contextBadges}>
              {question.fingerprint?.platform && question.fingerprint.platform !== 'UNKNOWN' && (
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>{question.fingerprint.platform}</Text>
                </View>
              )}
              {question.clarityScore && (
                <View style={styles.clarityBadge}>
                  <Text style={styles.clarityText}>Clarity {question.clarityScore.toFixed(1)}/10</Text>
                </View>
              )}
            </View>
            {isDev && (
              <TouchableOpacity style={styles.summaryBtn} onPress={getSummary} disabled={loadingSummary}>
                <Text style={styles.summaryBtnText}>
                  {loadingSummary ? '✨ Generating...' : summary ? '✨ Hide summary' : '✨ AI summary'}
                </Text>
              </TouchableOpacity>
            )}
            {summary && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Session banners */}
      {isDev && isPending && session && (
        <View style={styles.pendingBanner}>
          <Text style={styles.bannerTitle}>New session request · {price}</Text>
          <View style={styles.bannerBtns}>
            <TouchableOpacity style={styles.declineBtn} onPress={() => api.post(`/sessions/${thread.sessionId}/decline`)}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => api.post(`/sessions/${thread.sessionId}/accept`).then(() => qc.invalidateQueries({ queryKey: ['session', thread?.sessionId] }))}>
              <Text style={styles.acceptBtnText}>Accept ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isActive && isDev && (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerText}>🟢 Session active</Text>
          <TouchableOpacity onPress={() => complete.mutate()}>
            <Text style={styles.completeBtnText}>Mark complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEnded && !isDev && (
        <View style={styles.endedBanner}>
          <Text style={styles.endedText}>Approve the work to release payment</Text>
          <TouchableOpacity style={styles.approveBtn} onPress={() => approve.mutate()} disabled={approve.isPending}>
            <Text style={styles.approveBtnText}>{approve.isPending ? '...' : 'Approve & pay ✓'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color="#6C2FFF" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item: msg }) => {
            if (msg.type === 'SYSTEM_EVENT') return (
              <View style={styles.systemMsg}>
                <Text style={styles.systemText}>{msg.systemEventType?.replace(/_/g, ' ').toLowerCase()}</Text>
              </View>
            )
            const isMe = msg.senderId === user?.id
            const msgText = getMessageText(msg)
            if (!msgText) return null
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && <Text style={styles.senderName}>{otherPerson?.name}</Text>}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msgText}</Text>
                </View>
                <Text style={styles.time}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )
          }}
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={() => send.mutate()}
          disabled={!text.trim() || send.isPending}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  back: { fontSize: 13, color: '#6C2FFF', fontWeight: '500', width: 60 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  headerStatus: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  contextPanel: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  contextToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  contextPerson: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#6C2FFF' },
  personName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  personRating: { fontSize: 11, color: '#BA7517' },
  contextRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceBadge: { backgroundColor: '#FAEEDA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  priceText: { fontSize: 12, color: '#633806', fontWeight: '600' },
  chevron: { fontSize: 10, color: '#9CA3AF' },
  contextBody: { paddingHorizontal: 12, paddingBottom: 12 },
  contextQuestion: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  contextDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18, marginBottom: 6 },
  contextUrl: { fontSize: 11, color: '#6C2FFF', marginBottom: 8 },
  contextBadges: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  platformBadge: { backgroundColor: '#EEEDFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  platformText: { fontSize: 11, color: '#6C2FFF', fontWeight: '500' },
  clarityBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  clarityText: { fontSize: 11, color: '#6B7280' },
  summaryBtn: { borderWidth: 1, borderColor: '#AFA9EC', borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginBottom: 8 },
  summaryBtnText: { fontSize: 12, color: '#6C2FFF', fontWeight: '500' },
  summaryBox: { backgroundColor: '#EEEDFE', borderRadius: 8, padding: 10 },
  summaryText: { fontSize: 12, color: '#3C3489', lineHeight: 18 },
  pendingBanner: { backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FDE68A', padding: 12 },
  bannerTitle: { fontSize: 13, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  bannerBtns: { flexDirection: 'row', gap: 8 },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  declineBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  acceptBtn: { flex: 2, backgroundColor: '#6C2FFF', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  acceptBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  activeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderBottomWidth: 1, borderBottomColor: '#BBF7D0', paddingHorizontal: 16, paddingVertical: 8 },
  activeBannerText: { fontSize: 13, color: '#166534', fontWeight: '500' },
  completeBtnText: { fontSize: 13, color: '#166534', fontWeight: '600', borderWidth: 1, borderColor: '#86EFAC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  endedBanner: { backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  endedText: { fontSize: 12, color: '#6B7280', flex: 1 },
  approveBtn: { backgroundColor: '#6C2FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  approveBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  msgRow: { flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
  msgRowMe: { alignItems: 'flex-end' },
  senderName: { fontSize: 11, color: '#9CA3AF', paddingHorizontal: 4, marginBottom: 2 },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: '#6C2FFF', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  time: { fontSize: 11, color: '#9CA3AF', paddingHorizontal: 4 },
  systemMsg: { alignItems: 'center', marginVertical: 4 },
  systemText: { fontSize: 12, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#111827', maxHeight: 100 },
  sendBtn: { backgroundColor: '#6C2FFF', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
})
