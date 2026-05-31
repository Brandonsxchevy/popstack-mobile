cat > app/\(user\)/support.tsx << 'EOF'
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, FlatList } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function SupportScreen() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [showNew, setShowNew] = useState(false)

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => api.get('/support/my').then(r => r.data),
  })

  const submit = useMutation({
    mutationFn: async () => {
      const thread = await api.post('/support', { message, type: 'GENERAL' })
      return thread.data
    },
    onSuccess: (data) => {
      setMessage('')
      setShowNew(false)
      refetch()
      router.push({ pathname: '/threads/[id]', params: { id: data.id } })
    },
  })

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(!showNew)}>
          <Text style={styles.newBtnText}>{showNew ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showNew && (
          <View style={styles.newCard}>
            <Text style={styles.label}>How can we help?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Describe your issue or question..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {submit.isError && <Text style={styles.error}>Failed to send. Please try again.</Text>}
            <TouchableOpacity
              style={[styles.submitBtn, (!message.trim() || submit.isPending) && styles.submitBtnDisabled]}
              onPress={() => submit.mutate()}
              disabled={!message.trim() || submit.isPending}>
              {submit.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Send message</Text>}
            </TouchableOpacity>
          </View>
        )}

        {!showNew && (
          <>
            <Text style={styles.sectionTitle}>Your tickets</Text>
            {isLoading ? (
              <ActivityIndicator color="#6C2FFF" style={{ marginTop: 40 }} />
            ) : tickets.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyTitle}>No support tickets yet</Text>
                <Text style={styles.emptySub}>Tap + New to contact support.</Text>
              </View>
            ) : (
              tickets.map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.ticketCard}
                  onPress={() => router.push({ pathname: '/threads/[id]', params: { id: t.id } })}>
                  <Text style={styles.ticketPreview} numberOfLines={2}>
                    {t.messages?.[0]?.blocks?.[0]?.content || 'Support ticket'}
                  </Text>
                  <Text style={styles.ticketDate}>
                    {new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  newBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  content: { padding: 20 },
  newCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#E5E7EB', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textarea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', height: 140, marginBottom: 16 },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 12 },
  submitBtn: { backgroundColor: '#6C2FFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#C4B5FD' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#6B7280' },
  ticketCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#E5E7EB', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketPreview: { fontSize: 14, color: '#111827', flex: 1, marginRight: 12 },
  ticketDate: { fontSize: 12, color: '#9CA3AF' },
})
