import { useState, useRef } from 'react'
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { api } from '../../lib/api'

const { width: W } = Dimensions.get('window')
const SWIPE_THRESHOLD = W * 0.3

const PLATFORM_COLORS: Record<string, string> = {
  WORDPRESS: '#21759B', SHOPIFY: '#96BF48', WIX: '#FAAD4D', SQUARESPACE: '#000', WEBFLOW: '#4353FF',
}

const TIER_LABELS: Record<string, string> = {
  FIVE: '$7.50', TWENTY: '$30', FIFTY_PLUS: '$75+',
  QUICK_FOLLOWUP: '$7.50', FIFTEEN_MIN: '$30', FULL_SOLUTION: '$75+',
}

export default function SwipeScreen() {
  const qc = useQueryClient()
  const router = useRouter()
  const position = useRef(new Animated.ValueXY()).current
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['swipe-feed'],
    queryFn: () => api.get('/questions/feed').then(r => r.data),
  })

  const swipe = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: string }) =>
      api.post('/swipes', { questionId: id, direction }),
  })

  const handleSwipe = (direction: 'skip' | 'interested' | 'answer') => {
    const question = questions[currentIndex]
    if (direction === 'answer' && question) {
      swipe.mutate({ id: question.id, direction })
      router.push({ pathname: '/(dev)/respond', params: { questionId: question.id } })
      return
    }
    const toX = direction === 'skip' ? -W * 1.5 : W * 1.5
    Animated.timing(position, { toValue: { x: toX, y: 0 }, duration: 250, useNativeDriver: false }).start(() => {
      if (question) swipe.mutate({ id: question.id, direction })
      setCurrentIndex(i => i + 1)
      position.setValue({ x: 0, y: 0 })
      setSwipeDirection(null)
    })
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy })
      if (gesture.dx > 50) setSwipeDirection('right')
      else if (gesture.dx < -50) setSwipeDirection('left')
      else setSwipeDirection(null)
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) handleSwipe('answer')
      else if (gesture.dx < -SWIPE_THRESHOLD) handleSwipe('skip')
      else {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
        setSwipeDirection(null)
      }
    },
  })

  const rotate = position.x.interpolate({ inputRange: [-W/2, 0, W/2], outputRange: ['-8deg','0deg','8deg'] })
  const skipOpacity = position.x.interpolate({ inputRange: [-W/2, 0], outputRange: [1, 0], extrapolate: 'clamp' })
  const answerOpacity = position.x.interpolate({ inputRange: [0, W/2], outputRange: [0, 1], extrapolate: 'clamp' })

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C2FFF" /></View>

  const question = questions[currentIndex]
  const nextQuestion = questions[currentIndex + 1]

  if (!question) return (
    <View style={styles.center}>
      <Text style={styles.emptyEmoji}>🎉</Text>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>No more questions in your feed.</Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={() => { setCurrentIndex(0); qc.invalidateQueries({ queryKey: ['swipe-feed'] }) }}>
        <Text style={styles.refreshText}>Refresh feed</Text>
      </TouchableOpacity>
    </View>
  )

  const platform = question.fingerprint?.platform
  const platformColor = platform && platform !== 'UNKNOWN' ? PLATFORM_COLORS[platform] || '#6C2FFF' : '#6C2FFF'
  const price = TIER_LABELS[question.tier] || '$30'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>PopStack</Text>
        <Text style={styles.headerCount}>{currentIndex + 1} of {questions.length}</Text>
      </View>
      <View style={styles.cardArea}>
        {nextQuestion && (
          <View style={[styles.card, styles.nextCard]}>
            <Text style={styles.nextTitle} numberOfLines={2}>{nextQuestion.title}</Text>
          </View>
        )}
        <Animated.View style={[styles.card, styles.currentCard, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]} {...panResponder.panHandlers}>
          <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: skipOpacity }]}>
            <Text style={[styles.overlayText, { color: '#EF4444' }]}>SKIP</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.answerOverlay, { opacity: answerOpacity }]}>
            <Text style={[styles.overlayText, { color: '#22C55E' }]}>ANSWER</Text>
          </Animated.View>
          {platform && platform !== 'UNKNOWN' && (
            <View style={[styles.platformBadge, { backgroundColor: platformColor }]}>
              <Text style={styles.platformText}>{platform}</Text>
            </View>
          )}
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.title}>{question.title}</Text>
          {question.description && <Text style={styles.description} numberOfLines={4}>{question.description}</Text>}
          {question.url && <Text style={styles.url} numberOfLines={1}>{question.url}</Text>}
          <View style={styles.userRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{question.user?.name?.[0]?.toUpperCase() || '?'}</Text></View>
            <Text style={styles.userName}>{question.user?.name || 'Anonymous'}</Text>
          </View>
          <Text style={styles.hint}>← Skip · Swipe to answer →</Text>
        </Animated.View>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => handleSwipe('skip')}>
          <Text style={styles.skipBtnText}>✕ Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interestedBtn} onPress={() => handleSwipe('interested')}>
          <Text style={styles.interestedBtnText}>★ Interested</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.answerBtn} onPress={() => handleSwipe('answer')}>
          <Text style={styles.answerBtnText}>Answer →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  headerLogo: { fontSize: 20, fontWeight: '700', color: '#6C2FFF' },
  headerCount: { fontSize: 13, color: '#9CA3AF' },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: W - 32, backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  currentCard: { zIndex: 2 },
  nextCard: { zIndex: 1, transform: [{ scale: 0.95 }], top: 12, opacity: 0.8 },
  overlay: { position: 'absolute', top: 20, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 3, zIndex: 10 },
  skipOverlay: { left: 20, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', transform: [{ rotate: '-15deg' }] },
  answerOverlay: { right: 20, borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)', transform: [{ rotate: '15deg' }] },
  overlayText: { fontSize: 22, fontWeight: '800' },
  platformBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 12 },
  platformText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  price: { fontSize: 28, fontWeight: '700', color: '#6C2FFF', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 10, lineHeight: 28 },
  description: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  url: { fontSize: 12, color: '#6C2FFF', marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '600', color: '#6C2FFF' },
  userName: { fontSize: 13, color: '#6B7280' },
  hint: { fontSize: 11, color: '#D1D5DB', textAlign: 'center' },
  nextTitle: { fontSize: 16, fontWeight: '600', color: '#9CA3AF' },
  buttons: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16, gap: 8 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  skipBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  interestedBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#6C2FFF', alignItems: 'center' },
  interestedBtnText: { fontSize: 14, fontWeight: '600', color: '#6C2FFF' },
  answerBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#6C2FFF', alignItems: 'center' },
  answerBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  refreshBtn: { backgroundColor: '#6C2FFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  refreshText: { color: '#fff', fontWeight: '600' },
})
