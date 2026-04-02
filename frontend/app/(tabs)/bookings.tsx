import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Booking {
  id: string;
  carId: string;
  carName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
  android: { elevation: 6 },
  web: { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
  default: {},
});

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  const loadUserEmail = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setSavedEmail(email);
        fetchBookings(email);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading email:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserEmail();
  }, []);

  const fetchBookings = async (email: string) => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings/user/${email}`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!userEmail.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!userEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email');
      return;
    }
    try {
      await AsyncStorage.setItem('userEmail', userEmail);
      setSavedEmail(userEmail);
      setLoading(true);
      fetchBookings(userEmail);
    } catch (error) {
      Alert.alert('Error', 'Failed to save email');
    }
  };

  const handleChangeEmail = async () => {
    await AsyncStorage.removeItem('userEmail');
    setSavedEmail('');
    setUserEmail('');
    setBookings([]);
  };

  const onRefresh = () => {
    if (savedEmail) {
      setRefreshing(true);
      fetchBookings(savedEmail);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { bg: '#DCFCE7', color: '#166534', icon: 'checkmark-circle' as const };
      case 'pending':
        return { bg: '#FEF3C7', color: '#92400E', icon: 'time' as const };
      case 'cancelled':
        return { bg: '#FEE2E2', color: '#991B1B', icon: 'close-circle' as const };
      default:
        return { bg: '#F1F5F9', color: '#64748B', icon: 'ellipse' as const };
    }
  };

  const calculateDays = (start: string, end: string) => {
    const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  };

  // ─── Email Entry Screen ───
  if (!savedEmail) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={StyleSheet.absoluteFill} />
        <View style={styles.emailScreen}>
          <View style={styles.emailIconWrap}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.emailIconGrad}>
              <Ionicons name="calendar" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.emailTitle}>My Bookings</Text>
          <Text style={styles.emailSubtitle}>Enter your email to view your bookings</Text>

          <View style={styles.emailCard}>
            <View style={styles.emailInputWrap}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" />
              <TextInput
                style={styles.emailInput}
                placeholder="your@email.com"
                placeholderTextColor="#94A3B8"
                value={userEmail}
                onChangeText={setUserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.emailBtn} onPress={handleSaveEmail}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emailBtnGrad}>
                <Text style={styles.emailBtnText}>View Bookings</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Loading ───
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  // ─── Bookings List ───
  const renderBooking = ({ item }: { item: Booking }) => {
    const statusConfig = getStatusConfig(item.status);
    const days = calculateDays(item.startDate, item.endDate);

    return (
      <View style={[styles.bookingCard, cardShadow]}>
        {/* Header */}
        <View style={styles.bookingHeader}>
          <View style={styles.bookingCarIcon}>
            <Ionicons name="car-sport" size={20} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.carName} numberOfLines={1}>{item.carName}</Text>
            <Text style={styles.bookingDays}>{days} day{days > 1 ? 's' : ''} rental</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Date Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateCard}>
            <View style={[styles.dateDot, { backgroundColor: '#10B981' }]} />
            <View>
              <Text style={styles.dateLabel}>Pickup</Text>
              <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
            </View>
          </View>
          <View style={styles.dateArrow}>
            <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
          </View>
          <View style={styles.dateCard}>
            <View style={[styles.dateDot, { backgroundColor: '#EF4444' }]} />
            <View>
              <Text style={styles.dateLabel}>Return</Text>
              <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.bookingFooter}>
          <View>
            <Text style={styles.priceLabel}>Total Paid</Text>
            <Text style={styles.price}>₹{item.totalPrice}</Text>
          </View>
          <Text style={styles.bookingDate}>Booked {formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerEmail}>{savedEmail}</Text>
          </View>
          <TouchableOpacity style={styles.changeEmailBtn} onPress={handleChangeEmail}>
            <Ionicons name="swap-horizontal" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Summary Chips */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryNumber}>{bookings.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>
              {bookings.filter(b => b.status === 'pending').length}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
              {bookings.filter(b => b.status === 'confirmed').length}
            </Text>
            <Text style={styles.summaryLabel}>Confirmed</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="calendar-outline" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptySubtext}>Start browsing cars to make your first booking</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', fontSize: 15, marginTop: 16, fontWeight: '500' },

  // ── Email Screen ──
  emailScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emailIconWrap: { marginBottom: 24 },
  emailIconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  emailTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  emailSubtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 32, textAlign: 'center' },
  emailCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emailInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 10 },
  emailInput: { flex: 1, fontSize: 15, color: '#FFFFFF', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  emailBtn: { borderRadius: 14, overflow: 'hidden' },
  emailBtnGrad: { height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  emailBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // ── Header ──
  header: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerEmail: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  changeEmailBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },

  // ── Summary ──
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryChip: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingVertical: 10 },
  summaryNumber: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  // ── List ──
  listContent: { padding: 20, paddingBottom: 100 },

  // ── Booking Card ──
  bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 14 },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  bookingCarIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  carName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  bookingDays: { fontSize: 12, color: '#64748B' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // ── Date Row ──
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 14 },
  dateCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDot: { width: 8, height: 8, borderRadius: 4 },
  dateArrow: { marginHorizontal: 8 },
  dateLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginTop: 1 },

  // ── Footer ──
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  priceLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  price: { fontSize: 20, fontWeight: '800', color: '#3B82F6' },
  bookingDate: { fontSize: 11, color: '#94A3B8' },

  // ── Empty State ──
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconBg: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
