/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getExternalMapUrl } from '@/utils/api';
import type { RouteItem } from '@/utils/types';

const { width } = Dimensions.get('window');

// 到达阈值（米）
const ARRIVAL_THRESHOLD_METERS = 100;

interface NavigateScreenProps {
  currentRoute?: RouteItem | null;
}

export default function NavigateScreen({ currentRoute }: NavigateScreenProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [autoSwitch, setAutoSwitch] = useState(true); // 自动切换开关
  const [arrivedAtPoint, setArrivedAtPoint] = useState(false); // 是否已到达当前点
  const [showArrivalAlert, setShowArrivalAlert] = useState(false); // 是否显示到达提示
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSwitchIndexRef = useRef<number>(-1); // 记录上次自动切换的索引

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

  // 自动切换检测逻辑
  useEffect(() => {
    if (!autoSwitch || !location || !currentRoute || !navigating) {
      return;
    }

    const distance = getDistanceToNext();
    if (distance === null) return;

    const distanceInMeters = distance * 1000; // 转换为米

    // 检测是否到达（距离小于阈值）
    if (distanceInMeters < ARRIVAL_THRESHOLD_METERS) {
      // 防止重复触发（只有当索引变化时才触发）
      if (currentIndex !== lastAutoSwitchIndexRef.current && !arrivedAtPoint) {
        setArrivedAtPoint(true);
        setShowArrivalAlert(true);

        // 震动提示
        Vibration.vibrate([0, 500, 200, 500]);

        // 震动后自动切换
        setTimeout(() => {
          handleAutoNextPoint();
        }, 1500); // 1.5秒后自动切换
      }
    } else {
      // 远离目标点时重置状态
      if (distanceInMeters > ARRIVAL_THRESHOLD_METERS * 2) {
        setArrivedAtPoint(false);
      }
    }
  }, [location, currentIndex, autoSwitch, navigating, arrivedAtPoint, currentRoute]);

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
        timeInterval: 3000, // 更频繁的更新
        distanceInterval: 5,
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

  // 自动切换到下一站
  const handleAutoNextPoint = useCallback(() => {
    if (!currentRoute) return;

    if (currentIndex < currentRoute.orderedAddresses.length - 1) {
      // 更新索引记录
      lastAutoSwitchIndexRef.current = currentIndex + 1;
      setArrivedAtPoint(false);
      setShowArrivalAlert(false);

      // 显示切换提示
      const nextAddress = currentRoute.orderedAddresses[currentIndex + 1];
      Alert.alert(
        '已到达',
        `已自动切换到下一站：${nextAddress.name}`,
        [{ text: '知道了' }]
      );

      // 切换到下一站
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 所有站点都已到达
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      Alert.alert('导航完成', '您已到达所有目的地！', [
        {
          text: '重新开始',
          onPress: () => {
            setCurrentIndex(0);
            setElapsedTime(0);
            lastAutoSwitchIndexRef.current = -1;
            setArrivedAtPoint(false);
          },
        },
        {
          text: '结束导航',
          onPress: () => {
            setNavigating(false);
            setCurrentIndex(0);
            setElapsedTime(0);
            lastAutoSwitchIndexRef.current = -1;
            setArrivedAtPoint(false);
          },
        },
      ]);
    }
  }, [currentRoute, currentIndex]);

  // 手动切换到下一站
  const handleNextPoint = useCallback(() => {
    if (!currentRoute) return;

    // 手动切换时重置自动切换状态
    lastAutoSwitchIndexRef.current = currentIndex;
    setArrivedAtPoint(false);
    setShowArrivalAlert(false);

    if (currentIndex < currentRoute.orderedAddresses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      Alert.alert('导航完成', '您已到达所有目的地！', [
        {
          text: '重新开始',
          onPress: () => {
            setCurrentIndex(0);
            setElapsedTime(0);
            lastAutoSwitchIndexRef.current = -1;
          },
        },
        {
          text: '结束导航',
          onPress: () => {
            setNavigating(false);
            setCurrentIndex(0);
            setElapsedTime(0);
            lastAutoSwitchIndexRef.current = -1;
          },
        },
      ]);
    }
  }, [currentRoute, currentIndex]);

  const handlePrevPoint = useCallback(() => {
    if (currentIndex > 0) {
      lastAutoSwitchIndexRef.current = currentIndex - 1;
      setArrivedAtPoint(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

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

  const getDistanceToNext = useCallback(() => {
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
  }, [location, currentRoute, currentIndex]);

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

  const getBearing = useCallback(() => {
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
  }, [location, currentRoute, currentIndex]);

  // 格式化距离显示
  const formatDistance = (km: number | null) => {
    if (km === null) return '--';
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
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
  const distanceInMeters = distanceToNext !== null ? distanceToNext * 1000 : null;
  const bearing = getBearing();
  const progress = ((currentIndex + 1) / currentRoute.orderedAddresses.length) * 100;
  const isNearTarget = distanceInMeters !== null && distanceInMeters < ARRIVAL_THRESHOLD_METERS;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>实时导航</Text>
        <View style={styles.headerRight}>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={18} color="#6C63FF" />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={isNearTarget ? ['#00B894', '#00CEC9'] : ['#E8E8EB', '#F0F0F3']}
          style={[styles.mapPlaceholder, isNearTarget && styles.mapNearTarget]}
        >
          {/* Compass */}
          <View style={styles.compassContainer}>
            <View style={[styles.compass, { transform: [{ rotate: `${-bearing}deg` }] }]}>
              <Ionicons name="navigate" size={32} color={isNearTarget ? '#FFF' : '#6C63FF'} />
            </View>
            <Text style={[styles.compassText, isNearTarget && styles.compassTextActive]}>
              {Math.round(bearing)}°
            </Text>
          </View>

          {/* Distance Badge */}
          <View style={[styles.distanceBadge, isNearTarget && styles.distanceBadgeActive]}>
            <Ionicons
              name={isNearTarget ? 'checkmark-circle' : 'location'}
              size={20}
              color={isNearTarget ? '#FFF' : '#6C63FF'}
            />
            <Text style={[styles.distanceBadgeText, isNearTarget && styles.distanceBadgeTextActive]}>
              {formatDistance(distanceInMeters !== null ? distanceInMeters / 1000 : null)}
            </Text>
            {isNearTarget && (
              <Text style={styles.arrivalText}>即将到达</Text>
            )}
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

      {/* Auto Switch Toggle */}
      <View style={styles.autoSwitchContainer}>
        <View style={styles.autoSwitchLeft}>
          <Ionicons
            name={autoSwitch ? 'flash' : 'flash-outline'}
            size={18}
            color={autoSwitch ? '#FDCB6E' : '#B2BEC3'}
          />
          <Text style={styles.autoSwitchLabel}>自动切换下一站</Text>
        </View>
        <TouchableOpacity
          style={[styles.autoSwitchBtn, autoSwitch && styles.autoSwitchBtnActive]}
          onPress={() => setAutoSwitch(!autoSwitch)}
        >
          <View style={[styles.autoSwitchThumb, autoSwitch && styles.autoSwitchThumbActive]} />
        </TouchableOpacity>
      </View>

      {/* Current Destination */}
      <View style={[styles.destinationCard, isNearTarget && styles.destinationCardArrived]}>
        <View style={styles.destinationHeader}>
          <View style={[styles.indexBadge, isNearTarget && styles.indexBadgeArrived]}>
            <Text style={styles.indexBadgeText}>{currentIndex + 1}</Text>
          </View>
          <View style={styles.destinationInfo}>
            <Text style={[styles.destinationName, isNearTarget && styles.destinationNameArrived]}>
              {currentAddress.name}
            </Text>
            <Text style={styles.destinationAddress} numberOfLines={1}>
              {currentAddress.address}
            </Text>
          </View>
          {distanceInMeters !== null && (
            <View style={[styles.distanceBadgeSmall, isNearTarget && styles.distanceBadgeSmallActive]}>
              <Text style={[styles.distanceValue, isNearTarget && styles.distanceValueActive]}>
                {formatDistance(distanceInMeters)}
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

          <TouchableOpacity style={styles.nextBtn} onPress={handleNextPoint}>
            <LinearGradient
              colors={isNearTarget ? ['#00B894', '#00CEC9'] : ['#6C63FF', '#896BFF']}
              style={styles.nextBtnGradient}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex < currentRoute.orderedAddresses.length - 1 ? '下一站' : '完成'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => setNavigating(!navigating)}>
            <Ionicons name={navigating ? 'pause' : 'play'} size={24} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* External Maps */}
        <View style={styles.externalMaps}>
          <Text style={styles.externalMapsTitle}>其他地图导航</Text>
          <View style={styles.mapButtons}>
            <TouchableOpacity style={styles.mapBtn} onPress={() => handleOpenExternalMap('amap')}>
              <Text style={styles.mapBtnText}>高德</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn} onPress={() => handleOpenExternalMap('baidu')}>
              <Text style={styles.mapBtnText}>百度</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn} onPress={() => handleOpenExternalMap('google')}>
              <Text style={styles.mapBtnText}>谷歌</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn} onPress={() => handleOpenExternalMap('apple')}>
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
          {!autoSwitch && (
            <Text style={styles.autoSwitchHint}>提示：开启自动切换，到达后自动跳转</Text>
          )}
        </View>
      )}

      {/* Arrived Indicator */}
      {arrivedAtPoint && (
        <View style={styles.arrivedIndicator}>
          <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.arrivedGradient}>
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.arrivedText}>已到达，即将切换到下一站...</Text>
          </LinearGradient>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  mapPlaceholder: {
    height: 180,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapNearTarget: {
    borderWidth: 3,
    borderColor: '#00B894',
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
  compassTextActive: {
    color: '#FFF',
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceBadgeActive: {
    backgroundColor: '#00B894',
  },
  distanceBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
  distanceBadgeTextActive: {
    color: '#FFF',
  },
  arrivalText: {
    fontSize: 11,
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
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
  autoSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F0F3',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  autoSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoSwitchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 8,
  },
  autoSwitchBtn: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E8EB',
    padding: 2,
    justifyContent: 'center',
  },
  autoSwitchBtnActive: {
    backgroundColor: '#00B894',
  },
  autoSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  autoSwitchThumbActive: {
    alignSelf: 'flex-end',
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
  destinationCardArrived: {
    borderWidth: 2,
    borderColor: '#00B894',
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
  indexBadgeArrived: {
    backgroundColor: '#00B894',
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
  destinationNameArrived: {
    color: '#00B894',
  },
  destinationAddress: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 2,
  },
  distanceBadgeSmall: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  distanceBadgeSmallActive: {
    backgroundColor: 'rgba(0, 184, 148, 0.2)',
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C63FF',
  },
  distanceValueActive: {
    color: '#00B894',
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
    marginTop: 12,
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
  autoSwitchHint: {
    fontSize: 11,
    color: '#B2BEC3',
    marginTop: 8,
    fontStyle: 'italic',
  },
  arrivedIndicator: {
    position: 'absolute',
    top: '40%',
    left: 24,
    right: 24,
  },
  arrivedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  arrivedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 12,
  },
});
