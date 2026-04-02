import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
  android: { elevation: 6 },
  web: { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
  default: {},
});

export default function Booking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const carId = params.carId as string;
  const carName = params.carName as string;
  const pricePerDay = parseFloat(params.pricePerDay as string);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculateDays = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculateTotal = () => calculateDays() * pricePerDay;

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate >= endDate) setEndDate(new Date(selectedDate.getTime() + 86400000));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate && selectedDate > startDate) setEndDate(selectedDate);
  };

  const handleBooking = async () => {
    if (!userName.trim() || !userEmail.trim() || !userPhone.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields');
      return;
    }
    if (!userEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings`, {
        carId, carName, userName, userEmail, userPhone,
        startDate: startDate.toISOString(), endDate: endDate.toISOString(),
        totalPrice: calculateTotal(), status: 'pending',
      });
      await AsyncStorage.setItem('userEmail', userEmail);
      Alert.alert('Booking Confirmed!', 'Your booking has been submitted successfully', [
        { text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Book Your Ride</Text>
              <Text style={styles.headerSub}>{carName}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Your Info Section */}
          <View style={[styles.sectionCard, cardShadow]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Your Information</Text>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIconLeft} />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#94A3B8" value={userName} onChangeText={setUserName} />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIconLeft} />
              <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#94A3B8" value={userEmail} onChangeText={setUserEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIconLeft} />
              <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#94A3B8" value={userPhone} onChangeText={setUserPhone} keyboardType="phone-pad" />
            </View>
          </View>

          {/* Dates Section */}
          <View style={[styles.sectionCard, cardShadow]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="calendar-outline" size={18} color="#16A34A" />
              </View>
              <Text style={styles.sectionTitle}>Rental Period</Text>
            </View>

            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
              <View style={styles.dateBtnLeft}>
                <View style={[styles.dateDot, { backgroundColor: '#10B981' }]} />
                <View>
                  <Text style={styles.dateBtnLabel}>Pickup Date</Text>
                  <Text style={styles.dateBtnValue}>{formatDate(startDate)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker value={startDate} mode="date" display="default" minimumDate={new Date()} onChange={handleStartDateChange} />
            )}

            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
              <View style={styles.dateBtnLeft}>
                <View style={[styles.dateDot, { backgroundColor: '#EF4444' }]} />
                <View>
                  <Text style={styles.dateBtnLabel}>Return Date</Text>
                  <Text style={styles.dateBtnValue}>{formatDate(endDate)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker value={endDate} mode="date" display="default" minimumDate={startDate} onChange={handleEndDateChange} />
            )}

            <View style={styles.durationChip}>
              <Ionicons name="time-outline" size={16} color="#3B82F6" />
              <Text style={styles.durationText}>{calculateDays()} day{calculateDays() > 1 ? 's' : ''} rental</Text>
            </View>
          </View>

          {/* Price Summary */}
          <View style={[styles.summaryCard, cardShadow]}>
            <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.summaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Car</Text>
                <Text style={styles.summaryValue}>{carName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{calculateDays()} day{calculateDays() > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate</Text>
                <Text style={styles.summaryValue}>₹{pricePerDay}/day</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>₹{calculateTotal()}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, cardShadow]}>
          <TouchableOpacity
            style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
            onPress={handleBooking}
            disabled={loading}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtnGrad}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.confirmBtnText}>Confirm Booking  ·  ₹{calculateTotal()}</Text>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 24) + 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  content: { flex: 1, padding: 20 },

  // Section Cards
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  // Inputs
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', height: 52 },
  inputIconLeft: { marginLeft: 14, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingRight: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },

  // Date Buttons
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 10 },
  dateBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateDot: { width: 10, height: 10, borderRadius: 5 },
  dateBtnLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateBtnValue: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginTop: 2 },
  durationChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 8, marginTop: 4, gap: 6 },
  durationText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },

  // Summary
  summaryCard: { borderRadius: 20, overflow: 'hidden' },
  summaryGrad: { padding: 20 },
  summaryTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#94A3B8' },
  summaryValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  totalAmount: { fontSize: 24, fontWeight: '800', color: '#F59E0B' },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  confirmBtn: { borderRadius: 16, overflow: 'hidden' },
  confirmBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
