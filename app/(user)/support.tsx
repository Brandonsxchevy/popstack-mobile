import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function SupportScreen() {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const submit = useMutation({
    mutationFn: () => api.post('/support', { message, type: 'GENERAL' }),
    onSuccess: () => { setSent(true); setMessage('') },
  })

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Message sent!</Text>
            <Text style={styles.successDesc}>We'll get back to you as soon as possible.</Text>
            <TouchableOpacity style={styles.newBtn} onPress={() => setSent(false)}>
              <Text style={styles.newBtnText}>Send another message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
            {submit.isError && (
              <Text style={styles.error}>Failed to send. Please try again.</Text>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, (!message.trim() || submit.isPending) && styles.submitBtnDisabled]}
              onPress={() => submit.mutate()}
              disabled={!message.trim() || submit.isPending}>
              {submit.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Send message</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textarea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', height: 160, marginBottom: 16 },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 12 },
  submitBtn: { backgroundColor: '#6C2FFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#C4B5FD' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successCard: { alignItems: 'center', paddingTop: 60 },
  successEmoji: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  newBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  newBtnText: { color: '#fff', fontWeight: '600' },
})
