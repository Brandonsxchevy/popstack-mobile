import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

export default function BrowseScreen() {
  const router = useRouter()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/public/questions').then(r => setQuestions(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Live Requests</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={s.loginBtn}>Log in</Text>
        </TouchableOpacity>
      </View>

      <View style={s.banner}>
        <Text style={s.bannerTitle}>Real problems. Real fixers.</Text>
        <Text style={s.bannerSub}>Browse live website help requests from real users.</Text>
        <TouchableOpacity style={s.signupBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={s.signupBtnText}>Sign up free to get help →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6C2FFF" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {questions.map((q: any) => (
            <View key={q.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.tags}>
                  <View style={s.openBadge}><Text style={s.openBadgeText}>OPEN</Text></View>
                  {q.stackTags?.[0] && <View style={s.tag}><Text style={s.tagText}>{q.stackTags[0]}</Text></View>}
                </View>
                <Text style={s.amount}>${q.budgetTier === 'QUICK_FOLLOWUP' ? '7.50' : q.budgetTier === 'FIFTEEN_MIN' ? '30' : '75+'}</Text>
              </View>
              <Text style={s.cardTitle}>{q.title}</Text>
              {q.description && <Text style={s.cardDesc} numberOfLines={2}>{q.description}</Text>}
            </View>
          ))}
          {questions.length === 0 && <Text style={s.empty}>No open requests right now.</Text>}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', padding: 16, paddingTop: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  back: { fontSize: 15, color: '#6B7280' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  loginBtn: { fontSize: 14, color: '#6C2FFF', fontWeight: '600' },
  banner: { backgroundColor: '#6C2FFF', padding: 24, alignItems: 'center' },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 16 },
  signupBtn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  signupBtnText: { color: '#6C2FFF', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tags: { flexDirection: 'row', gap: 6 },
  openBadge: { backgroundColor: '#EEEDFE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  openBadgeText: { fontSize: 10, fontWeight: '700', color: '#6C2FFF' },
  tag: { backgroundColor: '#FEF3C7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 10, color: '#92400E' },
  amount: { fontSize: 14, fontWeight: '700', color: '#6C2FFF' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 1.5 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
})
