import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { api } from '../../lib/api'

const BUDGET_OPTIONS = [
  { value: 'QUICK_FOLLOWUP', label: '$7.50', desc: 'Quick fix' },
  { value: 'FIFTEEN_MIN', label: '$30', desc: '~15 min session' },
  { value: 'FULL_SOLUTION', label: '$75+', desc: 'Complex problem' },
]

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low', desc: 'Whenever' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Today' },
  { value: 'HIGH', label: 'High', desc: 'ASAP' },
]

export default function AskScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const params = useLocalSearchParams<{
    prefillTitle?: string
    prefillUrl?: string
    prefillBudget?: string
    devLinkId?: string
    preSelectedDevId?: string
    devId?: string
  }>()

  const [title, setTitle] = useState(params.prefillTitle || '')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState(params.prefillUrl || '')
  const [budgetTier, setBudgetTier] = useState(params.prefillBudget || 'FIFTEEN_MIN')
  const [urgency, setUrgency] = useState('MEDIUM')
  const [screenshotKeys, setScreenshotKeys] = useState<string[]>([])
  const [screenshotUris, setScreenshotUris] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handleScreenshotPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload screenshots.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 3,
    })
    if (result.canceled) return
    setUploading(true)
    try {
      const newKeys: string[] = []
      const newUris: string[] = []
      for (const asset of result.assets) {
        const { data } = await api.get('/uploads/screenshot')
        const blob = await fetch(asset.uri).then(r => r.blob())
        await fetch(data.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/jpeg' },
        })
        newKeys.push(data.key)
        newUris.push(asset.uri)
      }
      setScreenshotKeys(prev => [...prev, ...newKeys])
      setScreenshotUris(prev => [...prev, ...newUris])
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || 'Could not upload screenshot')
    } finally {
      setUploading(false)
    }
  }

  const removeScreenshot = (index: number) => {
    setScreenshotKeys(prev => prev.filter((_, i) => i !== index))
    setScreenshotUris(prev => prev.filter((_, i) => i !== index))
  }

  const submit = useMutation({
    mutationFn: () => api.post('/questions', {
      title,
      description,
      url,
      budgetTier,
      urgency,
      screenshotKeys,
      ...(params.devId && { preSelectedDevId: params.devId }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-questions'] })
      router.replace('/(user)/dashboard')
    },
  })

  const canSubmit = title.trim().length >= 5
  const isFromLink = !!params.devId

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Request</Text>
        <TouchableOpacity
          onPress={() => {
            if (!canSubmit) { Alert.alert('Required', 'Please enter at least 5 characters for your problem description'); return }
            submit.mutate()
          }}
          style={[styles.submitBtn, (!canSubmit || submit.isPending || uploading) && styles.submitBtnDisabled]}>
          {submit.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {isFromLink && (
          <View style={styles.linkBanner}>
            <Text style={styles.linkBannerText}>🔗 Sent directly to your developer</Text>
          </View>
        )}

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

        <Text style={styles.label}>Website URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://yoursite.com"
          placeholderTextColor="#9CA3AF"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>Screenshots</Text>
        <View style={styles.screenshotRow}>
          {screenshotUris.map((uri, i) => (
            <View key={i} style={styles.screenshotThumb}>
              <Image source={{ uri }} style={styles.screenshotImg} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeScreenshot(i)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {screenshotKeys.length < 3 && (
            <TouchableOpacity style={styles.uploadBtn} onPress={handleScreenshotPick} disabled={uploading}>
              {uploading
                ? <ActivityIndicator size="small" color="#6C2FFF" />
                : <Text style={styles.uploadBtnText}>{screenshotKeys.length === 0 ? '+ Add screenshot' : '+ Add more'}</Text>}
            </TouchableOpacity>
          )}
        </View>

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
  linkBanner: {
    backgroundColor: '#EEEDFE', borderRadius: 10, padding: 12,
    marginBottom: 16, alignItems: 'center',
  },
  linkBannerText: { fontSize: 13, fontWeight: '600', color: '#6C2FFF' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  textarea: { height: 100, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  screenshotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  screenshotThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  screenshotImg: { width: 80, height: 80 },
  removeBtn: {
    position: 'absolute', top: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  uploadBtn: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#6C2FFF', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEDFE',
  },
  uploadBtnText: { fontSize: 11, color: '#6C2FFF', fontWeight: '600', textAlign: 'center' },
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
