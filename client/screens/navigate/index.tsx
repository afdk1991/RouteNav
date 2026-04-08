import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getExternalMapUrl } from '@/utils/api';
import type { RouteItem } from '@/utils/types';

const { width } = Dimensions.get('window');

interface NavigateScreenProps {
  currentRoute?: RouteItem | null;
}

export default function NavigateScreen({ currentRoute }: NavigateScreenProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (navigating) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [navigating]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要位置权限才能使用导航功能');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('错误', '获取位置失败');
    } finally {
      setLoading(false);
    }

    // Watch position updates
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (newLocation) => {
        setLocation({
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
        });
      }
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextPoint = () => {
    if (!currentRoute) return;
    
    if (currentIndex < currentRoute.orderedAddresses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      Alert.alert('导航完成', '您已到达所有目的地！', [
        {
          text: '重新开始',
          onPress: () => setCurrentIndex(0),
        },
        {
          text: '结束导航',
          onPress: () => {
            setNavigating(false);
            setCurrentIndex(0);
            setElapsedTime(0);
          },
        },
      ]);
    }
  };

  const handlePrevPoint = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleOpenExternalMap = async (provider: 'amap' | 'baidu' | 'google' | 'apple') => {
    if (!currentRoute || currentRoute.orderedAddresses.length === 0) {
      Alert.alert('提示', '请先规划路线');
      return;
    }

    const targetAddress = currentRoute.orderedAddresses[currentIndex];
    const response = await getExternalMapUrl(
      targetAddress.latitude,
      targetAddress.longitude,
      targetAddress.name,
      provider
    );

    if (response.success && response.data) {
      try {
        const supported = await Linking.canOpenURL(response.data.url);
        if (supported) {
          await Linking.openURL(response.data.url);
        } else {
          Alert.alert('错误', '无法打开地图应用');
        }
      } catch (error) {
        Alert.alert('错误', '打开地图失败');
      }
    } else {
      Alert.alert('错误', response.error || '生成地图链接失败');
    }
  };

  const getDistanceToNext = () => {
    if (!location || !currentRoute || currentIndex >= currentRoute.orderedAddresses.length) {
      return null;
    }

    const target = currentRoute.orderedAddresses[currentIndex];
    const distance = haversineDistance(
      location.latitude,
      location.longitude,
      target.latitude,
      target.longitude
    );

    return distance;
  };

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getBearing = () => {
    if (!location || !currentRoute || currentIndex >= currentRoute.orderedAddresses.length) {
      return 0;
    }

    const target = currentRoute.orderedAddresses[currentIndex];
    const lat1 = location.latitude * (Math.PI / 180);
    const lat2 = target.latitude * (Math.PI / 180);
    const dLon = ((target.longitude - location.longitude) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>正在获取位置...</Text>
      </View>
    );
  }

  if (!currentRoute) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="navigate-outline" size={80} color="#B2BEC3" />
          <Text style={styles.emptyTitle}>暂无路线</Text>
          <Text style={styles.emptyText}>请先在「路线」页面规划路线</Text>
        </View>
      </View>
    );
  }

  const currentAddress = currentRoute.orderedAddresses[currentIndex];
  const nextAddress = currentRoute.orderedAddresses[currentIndex + 1];
  const distanceToNext = getDistanceToNext();
  const bearing = getBearing();
  const progress = ((currentIndex + 1) / currentRoute.orderedAddresses.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>实时导航</Text>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={18} color="#6C63FF" />
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={['#E8E8EB', '#F0F0F3']}
          style={styles.mapPlaceholder}
        >
          {/* Compass */}
          <View style={styles.compassContainer}>
            <View style={[styles.compass, { transform: [{ rotate: `${-bearing}deg` }] }]}>
              <Ionicons name="navigate" size={32} color="#6C63FF" />
            </View>
            <Text style={styles.compassText}>{Math.round(bearing)}°</Text>
          </View>

          {/* Location Info */}
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#6C63FF', '#896BFF']}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {currentRoute.orderedAddresses.length}
          </Text>
        </View>
      </View>

      {/* Current Destination */}
      <View style={styles.destinationCard}>
        <View style={styles.destinationHeader}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexBadgeText}>{currentIndex + 1}</Text>
          </View>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName}>{currentAddress.name}</Text>
            <Text style={styles.destinationAddress} numberOfLines={1}>
              {currentAddress.address}
            </Text>
          </View>
          {distanceToNext !== null && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceValue}>
                {distanceToNext < 1 ? `${Math.round(distanceToNext * 1000)}m` : `${distanceToNext.toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>

        {/* Navigation Controls */}
        <View style={styles.navControls}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrevPoint}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? '#B2BEC3' : '#6C63FF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNextPoint}
          >
            <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.nextBtnGradient}>
              <Text style={styles.nextBtnText}>
                {currentIndex < currentRoute.orderedAddresses.length - 1 ? '下一站' : '完成'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn]}
            onPress={() => setNavigating(!navigating)}
          >
            <Ionicons
              name={navigating ? 'pause' : 'play'}
              size={24}
              color="#6C63FF"
            />
          </TouchableOpacity>
        </View>

        {/* External Maps */}
        <View style={styles.externalMaps}>
          <Text style={styles.externalMapsTitle}>其他地图导航</Text>
          <View style={styles.mapButtons}>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenExternalMap('amap')}
            >
              <Text style={styles.mapBtnText}>高德</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenExternalMap('baidu')}
            >
              <Text style={styles.mapBtnText}>百度</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenExternalMap('google')}
            >
              <Text style={styles.mapBtnText}>谷歌</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenExternalMap('apple')}
            >
              <Text style={styles.mapBtnText}>苹果</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Next Destination Preview */}
      {nextAddress && (
        <View style={styles.nextPreview}>
          <Text style={styles.nextPreviewLabel}>下一站</Text>
          <Text style={styles.nextPreviewName}>{nextAddress.name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#636E72',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 8,
  },
  mapContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  compassContainer: {
    alignItems: 'center',
  },
  compass: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  compassText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginTop: 8,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#636E72',
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8E8EB',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
  destinationCard: {
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  indexBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indexBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  destinationAddress: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C63FF',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E8EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  nextBtn: {
    flex: 1,
    marginHorizontal: 16,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 14,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  externalMaps: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8EB',
    paddingTop: 16,
  },
  externalMapsTitle: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 12,
  },
  mapButtons: {
    flexDirection: 'row',
  },
  mapBtn: {
    flex: 1,
    backgroundColor: '#E8E8EB',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
  },
  nextPreview: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E8E8EB',
    borderRadius: 16,
  },
  nextPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B2BEC3',
    marginBottom: 4,
  },
  nextPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
  },
});
