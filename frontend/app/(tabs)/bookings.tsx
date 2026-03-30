import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    try {
      await AsyncStorage.setItem('userEmail', userEmail);
      setSavedEmail(userEmail);
      setLoading(true);
      fetchBookings(userEmail);
    } catch (error) {
      Alert.alert('Error', 'Failed to save email');
    }
  };

  const onRefresh = () => {
    if (savedEmail) {
      setRefreshing(true);
      fetchBookings(savedEmail);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.carName}>{item.carName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.dateLabel}>Pickup</Text>
          <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.dateLabel}>Return</Text>
          <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
        </View>
      </View>
      <View style={styles.bookingFooter}>
        <View>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.price}>${item.totalPrice}</Text>
        </View>
        <Text style={styles.bookingDate}>Booked: {formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  if (!savedEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.emailContainer}>
          <Ionicons name="mail-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emailTitle}>Enter Your Email</Text>
          <Text style={styles.emailSubtitle}>To view your bookings</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleSaveEmail}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>{savedEmail}</Text>
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>Start browsing cars to make your first booking</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  priceLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  emailContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  emailSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});