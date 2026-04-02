import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
// Screen dimensions available if needed

interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  image: string;
  availability: boolean;
  location: { address: string };
}

interface AdminStats {
  cars: { total: number; available: number; booked: number };
  bookings: { total: number; pending: number; confirmed: number };
  revenue: number;
  totalUsers: number;
  recentBookings: any[];
  userStats: any[];
}

type AdminTab = 'dashboard' | 'cars' | 'users';

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
  android: { elevation: 6 },
  web: { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
  default: {},
});

const lightShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 3 },
  web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  default: {},
});

export default function AdminPanel() {
  const [cars, setCars] = useState<Car[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('adminToken');
      if (savedToken) {
        const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (response.data.authenticated) {
          setToken(savedToken);
          setIsAuthenticated(true);
          fetchAllData(savedToken);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setAuthLoading(true);
    try {
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/login`, { email, password });
      const { token: newToken } = response.data;
      await AsyncStorage.setItem('adminToken', newToken);
      setToken(newToken);
      setIsAuthenticated(true);
      setLoading(true);
      fetchAllData(newToken);
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await AsyncStorage.removeItem('adminToken');
      setToken(null);
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
      setCars([]);
      setStats(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchAllData = async (authToken?: string) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const [carsRes, statsRes] = await Promise.all([
        axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/cars`),
        axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
      ]);
      setCars(carsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleDelete = (carId: string, carName: string) => {
    if (!token) return;
    Alert.alert('Delete Car', `Are you sure you want to delete ${carName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${EXPO_PUBLIC_BACKEND_URL}/api/cars/${carId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Car deleted successfully');
            fetchAllData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete car');
          }
        },
      },
    ]);
  };

  const toggleAvailability = async (carId: string, currentStatus: boolean) => {
    if (!token) return;
    try {
      await axios.put(
        `${EXPO_PUBLIC_BACKEND_URL}/api/cars/${carId}`,
        { availability: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  // ─────────────── LOGIN SCREEN ───────────────
  if (!isAuthenticated && !loading) {
    return (
      <View style={styles.loginWrapper}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.loginSafe}>
          <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.loginIconWrap}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.loginIconGrad}>
                <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.loginTitle}>Admin Panel</Text>
            <Text style={styles.loginSubtitle}>Sign in to manage your fleet</Text>

            <View style={styles.loginCard}>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail-outline" size={20} color="#64748B" />
                </View>
                <TextInput
                  style={styles.loginInput}
                  placeholder="Email address"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
                </View>
                <TextInput
                  style={styles.loginInput}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, authLoading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={authLoading}
              >
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.loginBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {authLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.hintText}>Default: admin@carrental.com / admin123</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ─────────────── LOADING ───────────────
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

  // ─────────────── DASHBOARD TAB ───────────────
  const renderDashboard = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
    >
      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, cardShadow, { backgroundColor: '#EFF6FF' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="car-sport" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats?.cars.total || 0}</Text>
          <Text style={styles.statLabel}>Total Cars</Text>
        </View>
        <View style={[styles.statCard, cardShadow, { backgroundColor: '#F0FDF4' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="calendar" size={22} color="#16A34A" />
          </View>
          <Text style={styles.statValue}>{stats?.bookings.total || 0}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
      </View>
      <View style={[styles.statsRow, { marginTop: 12 }]}>
        <View style={[styles.statCard, cardShadow, { backgroundColor: '#FFFBEB' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="currency-inr" size={22} color="#D97706" />
          </View>
          <Text style={styles.statValue}>{formatCurrency(stats?.revenue || 0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={[styles.statCard, cardShadow, { backgroundColor: '#FDF2F8' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: '#FCE7F3' }]}>
            <Ionicons name="people" size={22} color="#DB2777" />
          </View>
          <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
      </View>

      {/* Quick Status */}
      <View style={[styles.quickStatusCard, cardShadow]}>
        <Text style={styles.sectionTitle}>Fleet Status</Text>
        <View style={styles.quickStatusRow}>
          <View style={styles.quickStatusItem}>
            <View style={[styles.quickDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.quickLabel}>Available</Text>
            <Text style={styles.quickValue}>{stats?.cars.available || 0}</Text>
          </View>
          <View style={styles.quickStatusItem}>
            <View style={[styles.quickDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.quickLabel}>Booked</Text>
            <Text style={styles.quickValue}>{stats?.cars.booked || 0}</Text>
          </View>
          <View style={styles.quickStatusItem}>
            <View style={[styles.quickDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.quickLabel}>Pending</Text>
            <Text style={styles.quickValue}>{stats?.bookings.pending || 0}</Text>
          </View>
          <View style={styles.quickStatusItem}>
            <View style={[styles.quickDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.quickLabel}>Confirmed</Text>
            <Text style={styles.quickValue}>{stats?.bookings.confirmed || 0}</Text>
          </View>
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={[styles.sectionCard, cardShadow]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => setActiveTab('users')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {stats?.recentBookings && stats.recentBookings.length > 0 ? (
          stats.recentBookings.slice(0, 5).map((booking, idx) => (
            <View key={booking.id || idx} style={[styles.bookingItem, idx < Math.min(stats.recentBookings.length, 5) - 1 && styles.bookingBorder]}>
              <View style={styles.bookingAvatar}>
                <Text style={styles.bookingAvatarText}>
                  {(booking.userName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName} numberOfLines={1}>{booking.userName || 'Unknown'}</Text>
                <Text style={styles.bookingCar} numberOfLines={1}>{booking.carName} - {formatDate(booking.startDate)}</Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingPrice}>₹{booking.totalPrice}</Text>
                <View style={[styles.statusDot, { backgroundColor: booking.status === 'confirmed' ? '#10B981' : booking.status === 'pending' ? '#F59E0B' : '#EF4444' }]} />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyMini}>
            <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyMiniText}>No bookings yet</Text>
          </View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ─────────────── CARS TAB ───────────────
  const renderCarItem = ({ item }: { item: Car }) => (
    <View style={[styles.carCard, cardShadow]}>
      <Image source={{ uri: item.image }} style={styles.carImage} resizeMode="cover" />
      <View style={styles.carBody}>
        <View style={styles.carTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.carName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.carMeta}>{item.year} {item.make} {item.model}</Text>
          </View>
          <Text style={styles.carPrice}>₹{item.pricePerDay}<Text style={styles.carPriceUnit}>/day</Text></Text>
        </View>
        <View style={styles.carActions}>
          <TouchableOpacity
            style={[styles.toggleBtn, item.availability ? styles.toggleAvail : styles.toggleUnavail]}
            onPress={() => toggleAvailability(item.id, item.availability)}
          >
            <View style={[styles.toggleDot, { backgroundColor: item.availability ? '#6EE7B7' : '#FCA5A5' }]} />
            <Text style={[styles.toggleText, { color: item.availability ? '#065F46' : '#991B1B' }]}>
              {item.availability ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCarsTab = () => (
    <FlatList
      data={cars}
      renderItem={renderCarItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.carsListContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="car-sport-outline" size={40} color="#3B82F6" />
          </View>
          <Text style={styles.emptyTitle}>No Cars Yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first car</Text>
        </View>
      }
    />
  );

  // ─────────────── USERS TAB ───────────────
  const renderUsersTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
    >
      <View style={[styles.sectionCard, cardShadow]}>
        <Text style={styles.sectionTitle}>All Users</Text>
        {stats?.userStats && stats.userStats.length > 0 ? (
          stats.userStats.map((user, idx) => (
            <View key={user.email || idx} style={[styles.userItem, idx < stats.userStats.length - 1 && styles.bookingBorder]}>
              <View style={[styles.userAvatar, { backgroundColor: ['#DBEAFE', '#DCFCE7', '#FEF3C7', '#FCE7F3', '#E0E7FF'][idx % 5] }]}>
                <Text style={[styles.userAvatarText, { color: ['#2563EB', '#16A34A', '#D97706', '#DB2777', '#4F46E5'][idx % 5] }]}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || 'Unknown'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
              </View>
              <View style={styles.userStats}>
                <Text style={styles.userSpent}>₹{user.totalSpent}</Text>
                <Text style={styles.userBookings}>{user.totalBookings} booking{user.totalBookings !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyMini}>
            <Ionicons name="people-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyMiniText}>No users found</Text>
          </View>
        )}
      </View>

      {/* All Bookings */}
      <View style={[styles.sectionCard, cardShadow, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>All Bookings</Text>
        {stats?.recentBookings && stats.recentBookings.length > 0 ? (
          stats.recentBookings.map((booking, idx) => (
            <View key={booking.id || idx} style={[styles.bookingDetailItem, idx < stats.recentBookings.length - 1 && styles.bookingBorder]}>
              <View style={styles.bookingDetailTop}>
                <View>
                  <Text style={styles.bookingDetailName}>{booking.userName}</Text>
                  <Text style={styles.bookingDetailEmail}>{booking.userEmail}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: booking.status === 'confirmed' ? '#DCFCE7' : booking.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                }]}>
                  <Text style={[styles.statusBadgeText, {
                    color: booking.status === 'confirmed' ? '#166534' : booking.status === 'pending' ? '#92400E' : '#991B1B',
                  }]}>{booking.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.bookingDetailMid}>
                <View style={styles.bookingDetailChip}>
                  <Ionicons name="car-outline" size={14} color="#64748B" />
                  <Text style={styles.chipText}>{booking.carName}</Text>
                </View>
                <View style={styles.bookingDetailChip}>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text style={styles.chipText}>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</Text>
                </View>
              </View>
              <Text style={styles.bookingDetailPrice}>₹{booking.totalPrice}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyMini}>
            <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyMiniText}>No bookings yet</Text>
          </View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ─────────────── MAIN LAYOUT ───────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back</Text>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#F87171" />
            </TouchableOpacity>
          </View>

          {/* Tab Buttons */}
          <View style={styles.tabBar}>
            {([
              { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
              { key: 'cars', label: 'Cars', icon: 'car-sport-outline' },
              { key: 'users', label: 'Users', icon: 'people-outline' },
            ] as { key: AdminTab; label: string; icon: any }[]).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon} size={18} color={activeTab === tab.key ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'cars' && renderCarsTab()}
      {activeTab === 'users' && renderUsersTab()}

      {/* FAB - Add Car */}
      {activeTab === 'cars' && (
        <TouchableOpacity style={[styles.fab, cardShadow]} onPress={() => router.push('/add-car')}>
          <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.fabGrad}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // ── Loading ──
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: '#94A3B8', fontSize: 15, marginTop: 16, fontWeight: '500' },

  // ── Login ──
  loginWrapper: { flex: 1 },
  loginSafe: { flex: 1 },
  loginScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginIconWrap: { marginBottom: 24 },
  loginIconGrad: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  loginTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  loginSubtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 32, textAlign: 'center' },
  loginCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 14, height: 52, paddingHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  inputIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  loginInput: { flex: 1, fontSize: 15, color: '#FFFFFF', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  eyeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  loginBtn: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
  loginBtnGrad: { height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  hintText: { color: '#64748B', fontSize: 12, marginTop: 24, textAlign: 'center' },

  // ── Header ──
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 24) + 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  headerGreeting: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(248,113,113,0.12)', justifyContent: 'center', alignItems: 'center' },

  // ── Tabs ──
  tabBar: { flexDirection: 'row', gap: 8 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', gap: 6 },
  tabBtnActive: { backgroundColor: '#3B82F6' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tabBtnTextActive: { color: '#FFFFFF' },

  // ── Tab Content ──
  tabContent: { flex: 1, padding: 20 },

  // ── Stats Grid ──
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 16 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // ── Quick Status ──
  quickStatusCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16 },
  quickStatusRow: { flexDirection: 'row', marginTop: 12 },
  quickStatusItem: { flex: 1, alignItems: 'center' },
  quickDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  quickLabel: { fontSize: 11, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  quickValue: { fontSize: 18, fontWeight: '700', color: '#0F172A' },

  // ── Section Cards ──
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },

  // ── Booking Items ──
  bookingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  bookingBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  bookingAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bookingAvatarText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  bookingCar: { fontSize: 12, color: '#64748B' },
  bookingRight: { alignItems: 'flex-end' },
  bookingPrice: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // ── Empty states ──
  emptyMini: { alignItems: 'center', paddingVertical: 24 },
  emptyMiniText: { fontSize: 13, color: '#94A3B8', marginTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#64748B' },

  // ── Cars Tab ──
  carsListContent: { padding: 20, paddingBottom: 100 },
  carCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  carImage: { width: '100%', height: 140 },
  carBody: { padding: 14 },
  carTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  carName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  carMeta: { fontSize: 12, color: '#64748B' },
  carPrice: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
  carPriceUnit: { fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  carActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 6 },
  toggleAvail: { backgroundColor: '#DCFCE7' },
  toggleUnavail: { backgroundColor: '#FEE2E2' },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  deleteBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  // ── Users Tab ──
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#64748B' },
  userPhone: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  userStats: { alignItems: 'flex-end' },
  userSpent: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  userBookings: { fontSize: 11, color: '#64748B' },

  // ── Booking Detail ──
  bookingDetailItem: { paddingVertical: 14 },
  bookingDetailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bookingDetailName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  bookingDetailEmail: { fontSize: 12, color: '#64748B', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  bookingDetailMid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  bookingDetailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  chipText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  bookingDetailPrice: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },

  // ── FAB ──
  fab: { position: 'absolute', right: 20, bottom: 90, borderRadius: 28 },
  fabGrad: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});
