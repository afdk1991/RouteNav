/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AddressItem, RouteItem } from '@/utils/types';
import { getAddresses, getRoutes } from '@/utils/api';

interface HomeScreenProps {
  onNavigateToRoute?: () => void;
  onNavigateToNavigate?: () => void;
  onNavigateToAddresses?: () => void;
}

export default function HomeScreen({
  onNavigateToRoute,
  onNavigateToNavigate,
  onNavigateToAddresses,
}: HomeScreenProps) {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [addrRes, routeRes] = await Promise.all([getAddresses(), getRoutes()]);
    if (addrRes.success && addrRes.data) {
      setAddresses(addrRes.data);
    }
    if (routeRes.success && routeRes.data) {
      setRoutes(routeRes.data);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const latestRoute = routes.length > 0 ? routes[0] : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>你好</Text>
          <Text style={styles.title}>准备好规划路线了吗？</Text>
        </View>
        <View style={styles.avatarContainer}>
          <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.avatar}>
            <Ionicons name="navigate" size={24} color="#FFF" />
          </LinearGradient>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.statIcon}>
              <Ionicons name="location" size={20} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{addresses.length}</Text>
            <Text style={styles.statLabel}>个地址</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer]}>
            <LinearGradient colors={['#FF6584', '#FF8A80']} style={styles.statIcon}>
              <Ionicons name="git-branch" size={20} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{routes.length}</Text>
            <Text style={styles.statLabel}>条路线</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer]}>
            <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.statIcon}>
              <Ionicons name="analytics" size={20} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>
              {latestRoute ? latestRoute.totalDistance.toFixed(1) : '0'}
            </Text>
            <Text style={styles.statLabel}>总公里</Text>
          </View>
        </View>
      </View>

      {/* Latest Route */}
      {latestRoute && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最新路线</Text>
            <TouchableOpacity onPress={onNavigateToRoute}>
              <Text style={styles.sectionAction}>查看全部</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.routeIconBg}>
                <Ionicons name="navigate" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{latestRoute.name}</Text>
                <View style={styles.routeMeta}>
                  <Text style={styles.routeMetaText}>
                    {latestRoute.orderedAddresses.length}个地点
                  </Text>
                  <Text style={styles.routeDot}>·</Text>
                  <Text style={styles.routeMetaText}>
                    {latestRoute.totalDistance.toFixed(1)}公里
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.startNavBtn}
                onPress={onNavigateToNavigate}
              >
                <LinearGradient
                  colors={['#6C63FF', '#896BFF']}
                  style={styles.startNavBtnGradient}
                >
                  <Ionicons name="play" size={16} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Route Preview */}
            <View style={styles.routePreview}>
              {latestRoute.orderedAddresses.slice(0, 4).map((addr, index) => (
                <View key={addr.id} style={styles.routePoint}>
                  <View
                    style={[
                      styles.routePointDot,
                      index === 0 && styles.routePointStart,
                      index === latestRoute.orderedAddresses.length - 1 && styles.routePointEnd,
                    ]}
                  >
                    <Text style={styles.routePointNum}>{index + 1}</Text>
                  </View>
                  <Text style={styles.routePointName} numberOfLines={1}>
                    {addr.name}
                  </Text>
                </View>
              ))}
              {latestRoute.orderedAddresses.length > 4 && (
                <View style={styles.routeMore}>
                  <Text style={styles.routeMoreText}>
                    +{latestRoute.orderedAddresses.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToAddresses}
          >
            <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.actionIconBg}>
              <Ionicons name="add-circle" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>添加地址</Text>
            <Text style={styles.actionSubtext}>管理常用地点</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToRoute}
          >
            <LinearGradient colors={['#FF6584', '#FF8A80']} style={styles.actionIconBg}>
              <Ionicons name="analytics" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>规划路线</Text>
            <Text style={styles.actionSubtext}>智能优化路径</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToNavigate}
          >
            <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.actionIconBg}>
              <Ionicons name="navigate" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>开始导航</Text>
            <Text style={styles.actionSubtext}>实时导航指引</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Optimization Modes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>优化模式</Text>
        <View style={styles.modesContainer}>
          <View style={styles.modeCard}>
            <View style={[styles.modeIconBg, { backgroundColor: 'rgba(108, 99, 255, 0.12)' }]}>
              <Ionicons name="speedometer" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.modeName}>最短距离</Text>
            <Text style={styles.modeDesc}>贪心+2-opt{'\n'}速度优先</Text>
          </View>

          <View style={styles.modeCard}>
            <View style={[styles.modeIconBg, { backgroundColor: 'rgba(255, 101, 132, 0.12)' }]}>
              <Ionicons name="git-merge" size={24} color="#FF6584" />
            </View>
            <Text style={styles.modeName}>均衡路线</Text>
            <Text style={styles.modeDesc}>多次迭代{'\n'}效果优先</Text>
          </View>

          <View style={styles.modeCard}>
            <View style={[styles.modeIconBg, { backgroundColor: 'rgba(0, 184, 148, 0.12)' }]}>
              <Ionicons name="scan" size={24} color="#00B894" />
            </View>
            <Text style={styles.modeName}>区域扫描</Text>
            <Text style={styles.modeDesc}>同方向多地点{'\n'}效率优先</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#636E72',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D3436',
    marginTop: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {},
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 11,
    color: '#636E72',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 16,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  routeCard: {
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  routeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  routeDot: {
    marginHorizontal: 6,
    color: '#B2BEC3',
  },
  routeMetaText: {
    fontSize: 13,
    color: '#636E72',
  },
  startNavBtn: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startNavBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePoint: {
    alignItems: 'center',
    marginRight: 16,
  },
  routePointDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E8EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  routePointStart: {
    backgroundColor: '#00B894',
  },
  routePointEnd: {
    backgroundColor: '#FF6B6B',
  },
  routePointNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  routePointName: {
    fontSize: 11,
    color: '#636E72',
    maxWidth: 60,
  },
  routeMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C63FF',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: '1.5%',
    marginBottom: 12,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#636E72',
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  modeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 10,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 14,
  },
});
