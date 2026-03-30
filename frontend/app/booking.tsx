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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // Tomorrow
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculateDays = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    return calculateDays() * pricePerDay;
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate >= endDate) {
        setEndDate(new Date(selectedDate.getTime() + 86400000));
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate && selectedDate > startDate) {
      setEndDate(selectedDate);
    }
  };

  const handleBooking = async () => {
    if (!userName.trim() || !userEmail.trim() || !userPhone.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!userEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings`, {
        carId,
        carName,
        userName,
        userEmail,
        userPhone,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice: calculateTotal(),
        status: 'pending',
      });

      // Save email for future bookings
      await AsyncStorage.setItem('userEmail', userEmail);

      Alert.alert(
        'Success!',
        'Your booking has been submitted successfully',
        [
          {
            text: 'View Bookings',
            onPress: () => {
              router.replace('/(tabs)/bookings');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book {carName}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={userName}
                onChangeText={setUserName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                value={userEmail}
                onChangeText={setUserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 234 567 8900"
                value={userPhone}
                onChangeText={setUserPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Period</Text>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <View style={styles.dateButtonContent}>
                <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Pickup Date</Text>
                  <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleStartDateChange}
              />
            )}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <View style={styles.dateButtonContent}>
                <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Return Date</Text>
                  <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                minimumDate={startDate}
                onChange={handleEndDateChange}
              />
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{calculateDays()} days</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price per day</Text>
              <Text style={styles.summaryValue}>${pricePerDay}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${calculateTotal()}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={loading}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Processing...' : `Book for $${calculateTotal()}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateInfo: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
