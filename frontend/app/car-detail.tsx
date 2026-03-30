import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  image: string;
  availability: boolean;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.centerContainer}>
        <Text>Car not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: car.image }}
          style={styles.carImage}
          resizeMode="cover"
        />
        
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.carName}>{car.name}</Text>
              <Text style={styles.carDetails}>
                {car.year} {car.make} {car.model}
              </Text>
            </View>
            <View style={[styles.badge, car.availability ? styles.available : styles.unavailable]}>
              <Text style={[styles.badgeText, { color: car.availability ? '#34C759' : '#FF3B30' }]}>
                {car.availability ? 'Available' : 'Booked'}
              </Text>
            </View>
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Price per day</Text>
            <Text style={styles.price}>${car.pricePerDay}</Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.locationTitle}>Pickup Location</Text>
            </View>
            <Text style={styles.locationAddress}>{car.location.address}</Text>
            
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: car.location.lat,
                longitude: car.location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: car.location.lat,
                  longitude: car.location.lng,
                }}
                title={car.name}
                description={car.location.address}
              />
            </MapView>
          </View>
        </View>
      </ScrollView>

      {car.availability && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push({ pathname: '/booking', params: { carId: car.id, carName: car.name, pricePerDay: car.pricePerDay } })}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
  },
  carImage: {
    width: width,
    height: 280,
  },
  infoSection: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  carName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 16,
    color: '#8E8E93',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  available: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34C759',
  },
  unavailable: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF3B30',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  locationSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  locationAddress: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
