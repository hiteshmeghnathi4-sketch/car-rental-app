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
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
  android: { elevation: 6 },
  web: { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
  default: {},
});

export default function AddCar() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to select an image');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !make.trim() || !model.trim() || !year.trim() || !pricePerDay.trim() || !address.trim() || !image) {
      Alert.alert('Missing Fields', 'Please fill in all fields and select an image');
      return;
    }
    const yearNum = parseInt(year);
    const priceNum = parseFloat(pricePerDay);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) {
        Alert.alert('Error', 'You must be logged in as admin');
        router.back();
        return;
      }
      await axios.post(`${EXPO_PUBLIC_BACKEND_URL}/api/cars`, {
        name, make, model, year: yearNum, pricePerDay: priceNum, image,
        availability: true, location: { address, lat: 0, lng: 0 },
      }, { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert('Car Added!', 'The car has been added to your fleet', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error adding car:', error);
      Alert.alert('Error', 'Failed to add car');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ icon, placeholder, value, onChangeText, keyboardType, multiline }: any) => (
    <View style={[styles.inputWrap, multiline && { height: 80, alignItems: 'flex-start', paddingTop: 14 }]}>
      <Ionicons name={icon} size={18} color="#94A3B8" style={styles.inputIconLeft} />
      <TextInput
        style={[styles.input, multiline && { textAlignVertical: 'top' }]}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Add New Car</Text>
              <Text style={styles.headerSub}>Add a car to your fleet</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Image Picker */}
          <TouchableOpacity style={[styles.imagePicker, cardShadow]} onPress={pickImage} activeOpacity={0.8}>
            {image ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imageOverlay}>
                  <View style={styles.changePhotoBtn}>
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.cameraCircle}>
                  <Ionicons name="camera-outline" size={32} color="#3B82F6" />
                </View>
                <Text style={styles.imagePlaceholderTitle}>Upload Car Photo</Text>
                <Text style={styles.imagePlaceholderSub}>Tap to select from gallery</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Car Info Section */}
          <View style={[styles.sectionCard, cardShadow]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="car-sport-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Car Information</Text>
            </View>

            <InputField icon="text-outline" placeholder="Car Name (e.g., Premium Sedan)" value={name} onChangeText={setName} />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <InputField icon="business-outline" placeholder="Make" value={make} onChangeText={setMake} />
              </View>
              <View style={{ flex: 1 }}>
                <InputField icon="construct-outline" placeholder="Model" value={model} onChangeText={setModel} />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <InputField icon="calendar-outline" placeholder="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.inputWrap}>
                  <MaterialCommunityIcons name="currency-inr" size={18} color="#94A3B8" style={styles.inputIconLeft} />
                  <TextInput style={styles.input} placeholder="Price/Day" placeholderTextColor="#94A3B8" value={pricePerDay} onChangeText={setPricePerDay} keyboardType="decimal-pad" />
                </View>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={[styles.sectionCard, cardShadow]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="location-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>Pickup Location</Text>
            </View>
            <InputField icon="location-outline" placeholder="Full address" value={address} onChangeText={setAddress} multiline />
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, cardShadow]}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient colors={['#3B82F6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnGrad}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Add Car to Fleet</Text>
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
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  content: { flex: 1, padding: 20 },

  // Image Picker
  imagePicker: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', marginBottom: 16, height: 200 },
  imagePreviewWrap: { width: '100%', height: '100%', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 16 },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  changePhotoText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 20, margin: 2 },
  cameraCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  imagePlaceholderTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  imagePlaceholderSub: { fontSize: 13, color: '#94A3B8' },

  // Sections
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },

  // Inputs
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', height: 52 },
  inputIconLeft: { marginLeft: 14, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingRight: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  twoCol: { flexDirection: 'row', gap: 10 },

  // Footer
  footer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
