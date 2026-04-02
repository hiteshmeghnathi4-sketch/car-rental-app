import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  location: {
    address: string;
  };
}

const CATEGORIES = [
  { id: 'all', label: 'All Cars', icon: 'car-sport' as const },
  { id: 'suv', label: 'SUV', icon: 'car' as const },
  { id: 'sedan', label: 'Sedan', icon: 'car-sport-outline' as const },
  { id: 'hatchback', label: 'Hatch', icon: 'car-outline' as const },
  { id: 'luxury', label: 'Luxury', icon: 'diamond-outline' as const },
];

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: {
    elevation: 6,
  },
  web: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
  default: {},
});

const lightShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: {
    elevation: 3,
  },
  web: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  default: {},
});

export default function BrowseCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const router = useRouter();

  const fetchCars = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/cars`);
      setCars(response.data);
      setFilteredCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    let result = cars;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (car) =>
          car.name.toLowerCase().includes(query) ||
          car.make.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          (car.location?.address || '').toLowerCase().includes(query)
      );
    }
    if (activeCategory !== 'all') {
      result = result.filter(
        (car) =>
          car.make.toLowerCase().includes(activeCategory) ||
          car.model.toLowerCase().includes(activeCategory) ||
          car.name.toLowerCase().includes(activeCategory)
      );
    }
    setFilteredCars(result);
  }, [searchQuery, activeCategory, cars]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCars();
  }, []);

  const renderHeader = () => (
    <View>
      {/* Hero Header */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroGreeting}>Find Your</Text>
            <Text style={styles.heroTitle}>Perfect Ride</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <View style={styles.notificationDot} />
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cars, brands..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <View style={styles.searchDivider} />
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cars.length}</Text>
            <Text style={styles.statLabel}>Total Cars</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cars.filter(c => c.availability).length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {cars.length > 0 ? `₹${Math.min(...cars.map(c => c.pricePerDay))}` : '₹0'}
            </Text>
            <Text style={styles.statLabel}>Starting</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category Chips */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={18}
                color={activeCategory === cat.id ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  activeCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {searchQuery || activeCategory !== 'all' ? 'Results' : 'Available Cars'}
        </Text>
        <Text style={styles.resultsCount}>{filteredCars.length} found</Text>
      </View>
    </View>
  );

  const renderCar = ({ item, index }: { item: Car; index: number }) => (
    <TouchableOpacity
      style={[styles.carCard, cardShadow]}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/car-detail', params: { carId: item.id } })}
    >
      {/* Car Image with Gradient Overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.carImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageGradient}
        />

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceAmount}>₹{item.pricePerDay}</Text>
          <Text style={styles.priceUnit}>/day</Text>
        </View>

        {/* Availability Badge */}
        <View style={[
          styles.availBadge,
          { backgroundColor: item.availability ? '#10B981' : '#EF4444' }
        ]}>
          <View style={[
            styles.availDot,
            { backgroundColor: item.availability ? '#6EE7B7' : '#FCA5A5' }
          ]} />
          <Text style={styles.availText}>
            {item.availability ? 'Available' : 'Booked'}
          </Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteBtn}>
          <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Car Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleArea}>
            <Text style={styles.carName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.carMakeModel}>
              {item.year} {item.make} {item.model}
            </Text>
          </View>
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>4.8</Text>
          </View>
        </View>

        {/* Bottom Info Row */}
        <View style={styles.cardBottomRow}>
          <View style={styles.infoChip}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.infoChipText} numberOfLines={1}>
              {item.location?.address || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoChip}>
            <MaterialCommunityIcons name="gas-station-outline" size={14} color="#64748B" />
            <Text style={styles.infoChipText}>Petrol</Text>
          </View>
          <View style={styles.infoChip}>
            <MaterialCommunityIcons name="car-shift-pattern" size={14} color="#64748B" />
            <Text style={styles.infoChipText}>Manual</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Finding cars for you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={filteredCars}
        renderItem={renderCar}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="car-sport-outline" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.emptyTitle}>No Cars Found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Pull down to refresh or check back later'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 24,
  },

  // ── Hero Section ──
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroGreeting: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    zIndex: 1,
  },

  // ── Search Bar ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 10,
    marginRight: 8,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Stats Row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ── Category Chips ──
  categorySection: {
    marginTop: 20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },

  // ── Results Header ──
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // ── Car Card ──
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // ── Price Badge ──
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backdropFilter: 'blur(8px)',
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F59E0B',
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 2,
  },

  // ── Availability Badge ──
  availBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Favorite Button ──
  favoriteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Card Body ──
  cardBody: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleArea: {
    flex: 1,
    marginRight: 12,
  },
  carName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  carMakeModel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },

  // ── Bottom Info Row ──
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  infoChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },

  // ── Empty State ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
