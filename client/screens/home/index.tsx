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
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function HomeScreen() {
  const router = useSafeRouter();
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
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/addresses')}>
          <View style={styles.statIconContainer}>
            <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.statIcon}>
              <Ionicons name="location" size={20} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{addresses.length}</Text>
            <Text style={styles.statLabel}>个地址</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/routes')}>
          <View style={[styles.statIconContainer]}>
            <LinearGradient colors={['#FF6584', '#FF8A80']} style={styles.statIcon}>
              <Ionicons name="git-branch" size={20} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{routes.length}</Text>
            <Text style={styles.statLabel}>条路线</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/navigate')}>
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
        </TouchableOpacity>
      </View>

      {/* Latest Route */}
      {latestRoute && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最新路线</Text>
            <TouchableOpacity onPress={() => router.push('/routes')}>
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
                onPress={() => router.push('/navigate')}
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
            onPress={() => router.push('/attractions')}
          >
            <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.actionIconBg}>
              <Ionicons name="add-circle" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>添加景点</Text>
            <Text style={styles.actionSubtext}>快速添加热门地点</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/routes')}
          >
            <LinearGradient colors={['#FF6584', '#FF8A80']} style={styles.actionIconBg}>
              <Ionicons name="analytics" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>规划路线</Text>
            <Text style={styles.actionSubtext}>智能优化路径</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/navigate')}
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
          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => router.push('/routes', { mode: 'greedy' })}
          >
            <View style={[styles.modeIconBg, { backgroundColor: 'rgba(108, 99, 255, 0.12)' }]}>
              <Ionicons name="speedometer" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.modeName}>最短距离</Text>
            <Text style={styles.modeDesc}>贪心+2-opt{'\n'}速度优先</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => router.push('/routes', { mode: 'balanced' })}
          >
            <View style={[styles.modeIconBg, { backgroundColor: 'rgba(255, 101, 132, 0.12)' }]}>
              <Ionicons name="git-merge" size={24} color="#FF6584" />
            </View>
            <Text style={styles.modeName}>均衡路线</Text>
            <Text style={styles.modeDesc}>多次迭代{'\n'}效果优先</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => router.push('/routes', { mode: 'region' })}
          >
            <View style={[styles.modeIconBg, { backgroundColor: 'rgba(0, 184, 148, 0.12)' }]}>
              <Ionicons name="scan" size={24} color="#00B894" />
            </View>
            <Text style={styles.modeName}>区域扫描</Text>
            <Text style={styles.modeDesc}>同方向多地点{'\n'}效率优先</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  statLabel: {
    fontSize: 11,
    color: '#B2BEC3',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
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
  },
  sectionAction: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '600',
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  routeMetaText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  routeDot: {
    fontSize: 12,
    color: '#B2BEC3',
    marginHorizontal: 6,
  },
  startNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  startNavBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routePreview: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
    gap: 12,
  },
  routePoint: {
    flex: 1,
    alignItems: 'center',
  },
  routePointDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  routePointStart: {
    backgroundColor: '#6C63FF',
  },
  routePointEnd: {
    backgroundColor: '#FF6584',
  },
  routePointNum: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  routePointName: {
    fontSize: 10,
    color: '#636E72',
    textAlign: 'center',
  },
  routeMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F3',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  routeMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#636E72',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 10,
    color: '#B2BEC3',
    marginTop: 4,
    textAlign: 'center',
  },
  modesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 10,
    color: '#B2BEC3',
    textAlign: 'center',
    lineHeight: 14,
  },
});
