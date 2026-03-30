// MapView wrapper for cross-platform compatibility
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Only import MapView on mobile platforms
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
let MapView: any, Marker: any;

if (isNative) {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch (e) {
    console.warn('react-native-maps not available');
  }
}

interface MapProps {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export default function Map({ latitude, longitude, title, description }: MapProps) {
  if (!isNative || !MapView) {
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={48} color="#C7C7CC" />
        <Text style={styles.placeholderText}>Map view available on mobile</Text>
        <Text style={styles.coordinates}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        title={title}
        description={description}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  coordinates: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 4,
  },
});
