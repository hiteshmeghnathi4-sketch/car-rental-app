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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

export default function AdminPanel() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('adminToken');
      if (savedToken) {
        // Verify token is still valid
        const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (response.data.authenticated) {
          setToken(savedToken);
          setIsAuthenticated(true);
          fetchCars(savedToken);
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
      const response = await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/login`, {
        email,
        password
      });
      
      const { token: newToken } = response.data;
      await AsyncStorage.setItem('adminToken', newToken);
      setToken(newToken);
      setIsAuthenticated(true);
      setLoading(true);
      fetchCars(newToken);
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
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await AsyncStorage.removeItem('adminToken');
      setToken(null);
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
      setCars([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchCars = async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;
    
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/cars`);
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCars();
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCars();
  };

  const handleDelete = (carId: string, carName: string) => {
    if (!token) return;
    
    Alert.alert(
      'Delete Car',
      `Are you sure you want to delete ${carName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${EXPO_PUBLIC_BACKEND_URL}/api/cars/${carId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Car deleted successfully');
              fetchCars();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete car');
            }
          },
        },
      ]
    );
  };

  const toggleAvailability = async (carId: string, currentStatus: boolean) => {
    if (!token) return;
    
    try {
      await axios.put(`${EXPO_PUBLIC_BACKEND_URL}/api/cars/${carId}`, {
        availability: !currentStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCars();
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const renderCar = ({ item }: { item: Car }) => (
    <View style={styles.carCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.carImage}
        resizeMode="cover"
      />
      <View style={styles.carInfo}>
        <Text style={styles.carName}>{item.name}</Text>
        <Text style={styles.carDetails}>
          {item.year} {item.make} {item.model}
        </Text>
        <Text style={styles.price}>₹{item.pricePerDay}/day</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, item.availability ? styles.availableBtn : styles.unavailableBtn]}
            onPress={() => toggleAvailability(item.id, item.availability)}
          >
            <Ionicons
              name={item.availability ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>
              {item.availability ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
          <Text style={styles.loginTitle}>Admin Login</Text>
          <Text style={styles.loginSubtitle}>Enter your credentials to access admin panel</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.loginButton, authLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={authLoading}
          >
            <Text style={styles.loginButtonText}>
              {authLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.credentialsHint}>
            Default: admin@carrental.com / admin123
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage your car inventory</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={cars}
        renderItem={renderCar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-sport-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No cars in inventory</Text>
            <Text style={styles.emptySubtext}>Add your first car to get started</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-car')}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 150,
  },
  carInfo: {
    padding: 16,
  },
  carName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  availableBtn: {
    backgroundColor: '#34C759',
  },
  unavailableBtn: {
    backgroundColor: '#8E8E93',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
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
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  credentialsHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});