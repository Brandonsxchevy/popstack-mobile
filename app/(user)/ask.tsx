import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

const BUDGET_OPTIONS = [
  { value: 'FIVE', label: '$7.50', desc: 'Quick fix' },
  { value: 'TWENTY', label: '$30', desc: '~15 min session' },
  { value: 'FIFTY_PLUS', label: '$75+', desc: 'Complex problem' },
]

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low', desc: 'Whenever' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Today' },
  { value: 'HIGH', label: 'High', desc: 'ASAP' },
]

export default function AskScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [budgetTier, setBudgetTier] = useState('TWENTY')
  const [urgency, setUrgency] = useState('MEDIUM')

  const submit = useMutation({
    mutationFn: () => api.post('/questions', { title, description, url, budgetTier, urgency, screenshotKeys: [] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-questions'] })
      router.replace('/(user)/dashboard')
    },
  })

  const canSubmit = title.trim().length >= 5 && url.trim().length > 0

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <TouchableOpacity
          onPress={() => submit.mutate()}
          disabled={!canSubmit || submit.isPending}
          style={[styles.submitBtn, (!canSubmit || submit.isPending) && styles.submitBtnDisabled]}>
          {submit.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>What's the problem? *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Shopify checkout not loading on mobile"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <Text style={styles.charCount}>{title.length}/120</Text>

        <Text style={styles.label}>Describe the issue</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="What exactly is happening? What have you tried?"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Website URL *</Text>
        <TextInput
          style={styles.input}
          placeholder="https://yoursite.com"
          placeholderTextColor="#9CA3AF"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>Budget</Text>
        <View style={styles.optionRow}>
          {BUDGET_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[styles.optionBtn, budgetTier === o.value && styles.optionBtnActive]}
              onPress={() => setBudgetTier(o.value)}>
              <Text style={[styles.optionLabel, budgetTier === o.value && styles.optionLabelActive]}>{o.label}</Text>
              <Text style={[styles.optionDesc, budgetTier === o.value && styles.optionDescActive]}>{o.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Urgency</Text>
        <View style={styles.optionRow}>
          {URGENCY_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[styles.optionBtn, urgency === o.value && styles.optionBtnActive]}
              onPress={() => setUrgency(o.value)}>
              <Text style={[styles.optionLabel, urgency === o.value && styles.optionLabelActive]}>{o.label}</Text>
              <Text style={[styles.optionDesc, urgency === o.value && styles.optionDescActive]}>{o.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {submit.isError && (
          <Text style={styles.error}>
            {(submit.error as any)?.response?.data?.message || 'Failed to post request'}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
  },
  cancel: { fontSize: 15, color: '#6B7280' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  submitBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  submitBtnDisabled: { backgroundColor: '#C4B5FD' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  textarea: { height: 100, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    flex: 1, padding: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  optionBtnActive: { borderColor: '#6C2FFF', backgroundColor: '#EEEDFE' },
  optionLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  optionLabelActive: { color: '#6C2FFF' },
  optionDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  optionDescActive: { color: '#8B5CF6' },
  error: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 16 },
})
