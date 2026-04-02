import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
  android: { elevation: 6 },
  web: { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
  default: {},
});

export default function CarDetail() {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  const carId = params.carId as string;

  useEffect(() => {
    fetchCarDetail();
  }, []);

  const fetchCarDetail = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/cars/${carId}`);
      setCar(response.data);
    } catch (error) {
      console.error('Error fetching car detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading car details...</Text>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.loadingWrap}>
        <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />
        <Ionicons name="car-sport-outline" size={48} color="#64748B" />
        <Text style={styles.loadingText}>Car not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image */}
        <View style={styles.heroSection}>
          <Image source={{ uri: car.image }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(15,23,42,0.7)', 'transparent', 'rgba(15,23,42,0.85)']}
            locations={[0, 0.4, 1]}
            style={styles.heroOverlay}
          />

          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBtn}>
              <Ionicons name="heart-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Availability + Rating on image */}
          <View style={styles.heroBottom}>
            <View style={[styles.availBadge, { backgroundColor: car.availability ? '#10B981' : '#EF4444' }]}>
              <View style={[styles.availDot, { backgroundColor: car.availability ? '#6EE7B7' : '#FCA5A5' }]} />
              <Text style={styles.availText}>{car.availability ? 'Available' : 'Booked'}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>4.8</Text>
              <Text style={styles.ratingCount}>(24)</Text>
            </View>
          </View>
        </View>

        {/* Info Card - overlapping hero */}
        <View style={styles.infoContainer}>
          <View style={[styles.infoCard, cardShadow]}>
            {/* Title Row */}
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.carName}>{car.name}</Text>
                <Text style={styles.carMeta}>{car.year} {car.make} {car.model}</Text>
              </View>
            </View>

            {/* Feature Chips */}
            <View style={styles.featureRow}>
              <View style={styles.featureChip}>
                <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="gas-station-outline" size={18} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.featureLabel}>Fuel</Text>
                  <Text style={styles.featureValue}>Petrol</Text>
                </View>
              </View>
              <View style={styles.featureChip}>
                <View style={[styles.featureIcon, { backgroundColor: '#F0FDF4' }]}>
                  <MaterialCommunityIcons name="car-shift-pattern" size={18} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.featureLabel}>Gear</Text>
                  <Text style={styles.featureValue}>Manual</Text>
                </View>
              </View>
              <View style={styles.featureChip}>
                <View style={[styles.featureIcon, { backgroundColor: '#FFFBEB' }]}>
                  <MaterialCommunityIcons name="car-seat" size={18} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.featureLabel}>Seats</Text>
                  <Text style={styles.featureValue}>5</Text>
                </View>
              </View>
            </View>

            {/* Price Card */}
            <LinearGradient colors={['#0F172A', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.priceCard}>
              <View>
                <Text style={styles.priceLabel}>Price per day</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.priceAmount}>₹{car.pricePerDay}</Text>
                  <Text style={styles.priceUnit}>/day</Text>
                </View>
              </View>
              <View style={styles.priceDivider} />
              <View>
                <Text style={styles.priceLabel}>Est. weekly</Text>
                <Text style={styles.priceSecondary}>₹{car.pricePerDay * 7}</Text>
              </View>
            </LinearGradient>

            {/* Location */}
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>Pickup Location</Text>
                <Text style={styles.locationAddress}>{car.location?.address || 'N/A'}</Text>
              </View>
              <Ionicons name="navigate-outline" size={20} color="#3B82F6" />
            </View>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Footer */}
      {car.availability && (
        <View style={[styles.footer, cardShadow]}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Total</Text>
            <Text style={styles.footerPriceAmount}>₹{car.pricePerDay}<Text style={styles.footerPriceUnit}>/day</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push({ pathname: '/booking', params: { carId: car.id, carName: car.name, pricePerDay: car.pricePerDay } })}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookBtnGrad}>
              <Text style={styles.bookBtnText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: '#94A3B8', fontSize: 15, marginTop: 16, fontWeight: '500' },
  goBackBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#3B82F6', borderRadius: 12 },
  goBackText: { color: '#FFF', fontWeight: '600', fontSize: 15 },

  // Hero
  heroSection: { position: 'relative', height: 340 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  topBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 12,
    left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between',
  },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  ratingCount: { fontSize: 12, color: '#94A3B8' },

  // Info Card
  infoContainer: { marginTop: -40, paddingHorizontal: 16 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  titleRow: { marginBottom: 20 },
  carName: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  carMeta: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  // Features
  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  featureChip: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, gap: 10 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  featureValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 1 },

  // Price Card
  priceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, marginBottom: 16 },
  priceLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  priceAmount: { fontSize: 28, fontWeight: '800', color: '#F59E0B' },
  priceUnit: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  priceDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20 },
  priceSecondary: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  // Location
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, gap: 12 },
  locationIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  locationTitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  locationAddress: { fontSize: 14, fontWeight: '600', color: '#0F172A' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  footerPrice: {},
  footerPriceLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  footerPriceAmount: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  footerPriceUnit: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  bookBtn: { borderRadius: 16, overflow: 'hidden' },
  bookBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16, gap: 8 },
  bookBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
