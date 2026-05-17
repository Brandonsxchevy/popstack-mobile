import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

const OFFER_OPTIONS = [
  { cents: 750, label: '$7.50', desc: 'Quick follow-up' },
  { cents: 3000, label: '$30', desc: '15 min session' },
  { cents: 7500, label: '$75+', desc: 'Full solution' },
]

export default function RespondScreen() {
  const { questionId } = useLocalSearchParams()
  const router = useRouter()
  const [response, setResponse] = useState('')
  const [offerPriceCents, setOfferPriceCents] = useState(3000)
  const [submitting, setSubmitting] = useState(false)

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', questionId],
    queryFn: () => api.get(`/questions/${questionId}`).then(r => r.data),
    enabled: !!questionId,
  })

  const submit = async () => {
    if (!response.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/questions/${questionId}/response`, {
        blocks: [{ type: 'text', content: response.trim() }],
        effortEstimate: 'quick',
        offerPriceCents,
        offerTimeMinutes: 15,
      })
      router.replace('/(dev)/swipe')
    } catch (err: any) {
      console.error(err?.response?.data || err)
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C2FFF" /></View>

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your response</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {question && (
          <View style={styles.questionCard}>
            <Text style={styles.questionTitle}>{question.title}</Text>
            {question.description && <Text style={styles.questionDesc}>{question.description}</Text>}
            {question.url && <Text style={styles.questionUrl}>{question.url}</Text>}
          </View>
        )}
        <Text style={styles.label}>Your free diagnosis</Text>
        <TextInput
          style={styles.input}
          value={response}
          onChangeText={setResponse}
          placeholder="Describe what you think the issue is and how you'd fix it..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{500 - response.length} chars left</Text>
        <Text style={styles.label}>Session offer</Text>
        <View style={styles.offerRow}>
          {OFFER_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.cents}
              style={[styles.offerBtn, offerPriceCents === o.cents && styles.offerBtnActive]}
              onPress={() => setOfferPriceCents(o.cents)}>
              <Text style={[styles.offerPrice, offerPriceCents === o.cents && styles.offerPriceActive]}>{o.label}</Text>
              <Text style={[styles.offerDesc, offerPriceCents === o.cents && styles.offerDescActive]}>{o.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>The user sees your diagnosis for free. They pay to start a session.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (!response.trim() || submitting) && styles.btnDisabled]}
          onPress={submit}
          disabled={submitting || !response.trim()}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send response →</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  back: { fontSize: 14, color: '#6C2FFF', fontWeight: '500', width: 60 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  content: { flex: 1, padding: 16 },
  questionCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 20 },
  questionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  questionDesc: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  questionUrl: { fontSize: 12, color: '#6C2FFF' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 14, color: '#111827', minHeight: 160, marginBottom: 4 },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginBottom: 16 },
  offerRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  offerBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, alignItems: 'center' },
  offerBtnActive: { borderColor: '#6C2FFF', backgroundColor: '#EEEDFE' },
  offerPrice: { fontSize: 16, fontWeight: '700', color: '#111827' },
  offerPriceActive: { color: '#6C2FFF' },
  offerDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  offerDescActive: { color: '#6C2FFF' },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 24 },
  footer: { padding: 16, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  btn: { backgroundColor: '#6C2FFF', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
