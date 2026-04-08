/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import type { AddressItem, RouteItem } from '@/utils/types';
import { getAddresses, getRoutes, optimizeRoute, deleteRoute } from '@/utils/api';

interface RouteScreenProps {
  onNavigateToPreview?: (route: RouteItem) => void;
}

export default function RouteScreen({ onNavigateToPreview }: RouteScreenProps) {
  const router = useSafeRouter();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [optimizationMode, setOptimizationMode] = useState<'shortest' | 'balanced' | 'regional'>('shortest');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteItem | null>(null);

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

  const toggleAddress = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOptimize = async () => {
    if (selectedIds.length < 2) {
      Alert.alert('提示', '请至少选择2个地址进行路线规划');
      return;
    }

    setOptimizing(true);
    const response = await optimizeRoute(selectedIds, optimizationMode);
    setOptimizing(false);

    if (response.success && response.data) {
      setCurrentRoute(response.data);
      setRoutes((prev) => [response.data!, ...prev]);
      setModalVisible(false);
      setSelectedIds([]);
      
      if (onNavigateToPreview) {
        onNavigateToPreview(response.data);
      }
    } else {
      Alert.alert('错误', response.error || '路线优化失败');
    }
  };

  const handleDeleteRoute = (route: RouteItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除路线"${route.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const response = await deleteRoute(route.id);
            if (response.success) {
              setRoutes((prev) => prev.filter((r) => r.id !== route.id));
            } else {
              Alert.alert('错误', response.error || '删除失败');
            }
          },
        },
      ]
    );
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'shortest':
        return '最短距离';
      case 'balanced':
        return '均衡路线';
      case 'regional':
        return '区域扫描';
      default:
        return mode;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'shortest':
        return 'speedometer';
      case 'balanced':
        return 'git平衡';
      case 'regional':
        return 'scan';
      default:
        return 'help';
    }
  };

  const renderRouteItem = ({ item }: { item: RouteItem }) => (
    <TouchableOpacity 
      style={styles.routeCard}
      onPress={() => router.push('/route-detail', { route: JSON.stringify(item) })}
      onLongPress={() => handleDeleteRoute(item)}
      activeOpacity={0.8}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeIconContainer}>
          <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.routeIconBg}>
            <Ionicons name="navigate" size={22} color="#FFF" />
          </LinearGradient>
        </View>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.name}</Text>
          <View style={styles.routeMeta}>
            <View style={styles.modeTag}>
              <Ionicons name={getModeIcon(item.optimizationMode) as any} size={12} color="#6C63FF" />
              <Text style={styles.modeTagText}>{getModeLabel(item.optimizationMode)}</Text>
            </View>
            <Text style={styles.routeDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/route-detail', { route: JSON.stringify(item) })}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color="#6C63FF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.routeStats}>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color="#636E72" />
          <Text style={styles.statValue}>{item.orderedAddresses.length}</Text>
          <Text style={styles.statLabel}>个地点</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="analytics" size={16} color="#636E72" />
          <Text style={styles.statValue}>{item.totalDistance}</Text>
          <Text style={styles.statLabel}>公里</Text>
        </View>
      </View>

      <View style={styles.routeAddresses}>
        {item.orderedAddresses.slice(0, 3).map((addr, index) => (
          <View key={addr.id} style={styles.addressPill}>
            <Text style={styles.addressPillText} numberOfLines={1}>
              {index + 1}. {addr.name}
            </Text>
          </View>
        ))}
        {item.orderedAddresses.length > 3 && (
          <View style={[styles.addressPill, styles.morePill]}>
            <Text style={styles.morePillText}>+{item.orderedAddresses.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAddressCheckbox = ({ item }: { item: AddressItem }) => (
    <TouchableOpacity
      style={[styles.checkboxItem, selectedIds.includes(item.id) && styles.checkboxItemSelected]}
      onPress={() => toggleAddress(item.id)}
    >
      <View style={[styles.checkbox, selectedIds.includes(item.id) && styles.checkboxSelected]}>
        {selectedIds.includes(item.id) && (
          <Ionicons name="checkmark" size={14} color="#FFF" />
        )}
      </View>
      <View style={styles.checkboxInfo}>
        <Text style={styles.checkboxName}>{item.name}</Text>
        <Text style={styles.checkboxAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      {item.isStart && <View style={[styles.flag, styles.flagStart]} />}
      {item.isEnd && <View style={[styles.flag, styles.flagEnd]} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>路线规划</Text>
        <Text style={styles.headerSubtitle}>{routes.length} 条规划路线</Text>
      </View>

      {/* Route List */}
      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="git-branch-outline" size={64} color="#B2BEC3" />
          <Text style={styles.emptyText}>暂无路线</Text>
          <Text style={styles.emptySubtext}>选择地址并优化生成路线</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Optimize Button */}
      <TouchableOpacity
        style={styles.optimizeButton}
        onPress={() => setModalVisible(true)}
      >
        <LinearGradient
          colors={['#6C63FF', '#896BFF']}
          style={styles.optimizeButtonGradient}
        >
          <Ionicons name="analytics" size={22} color="#FFF" />
          <Text style={styles.optimizeButtonText}>优化路线</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>选择地址</Text>
                <Text style={styles.modalSubtitle}>
                  已选择 {selectedIds.length} 个地址（需要至少2个）
                </Text>

                {/* Mode Selection */}
                <View style={styles.modeSection}>
                  <Text style={styles.modeSectionTitle}>优化模式</Text>
                  <View style={styles.modeButtons}>
                    {(['shortest', 'balanced', 'regional'] as const).map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.modeButton, optimizationMode === mode && styles.modeButtonActive]}
                        onPress={() => setOptimizationMode(mode)}
                      >
                        <Ionicons
                          name={getModeIcon(mode) as any}
                          size={18}
                          color={optimizationMode === mode ? '#6C63FF' : '#B2BEC3'}
                        />
                        <Text
                          style={[
                            styles.modeButtonText,
                            optimizationMode === mode && styles.modeButtonTextActive,
                          ]}
                        >
                          {getModeLabel(mode)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.modeDescription}>
                    {optimizationMode === 'shortest' && '贪心算法 + 2-opt 优化，速度快'}
                    {optimizationMode === 'balanced' && '多次迭代深度优化，效果好'}
                    {optimizationMode === 'regional' && '适合同方向多地点，效率高'}
                  </Text>
                </View>

                {/* Address List */}
                <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
                  {addresses.map((item) => renderAddressCheckbox({ item }))}
                </ScrollView>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedIds([]);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      styles.optimizeBtn,
                      (selectedIds.length < 2 || optimizing) && styles.optimizeBtnDisabled,
                    ]}
                    onPress={handleOptimize}
                    disabled={selectedIds.length < 2 || optimizing}
                  >
                    {optimizing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.optimizeBtnText}>开始优化</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F3',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3436',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#636E72',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  routeCard: {
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeIconContainer: {
    marginRight: 14,
  },
  routeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  editBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 12,
  },
  modeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6C63FF',
    marginLeft: 4,
  },
  routeDate: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6C63FF',
    marginHorizontal: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D9E6',
  },
  routeAddresses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addressPill: {
    backgroundColor: '#E8E8EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: 120,
  },
  addressPillText: {
    fontSize: 12,
    color: '#636E72',
  },
  morePill: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  morePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  optimizeButton: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  optimizeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 16,
  },
  optimizeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
  },
  modalContent: {
    backgroundColor: '#F0F0F3',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D9E6',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 20,
  },
  modeSection: {
    marginBottom: 16,
  },
  modeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8EB',
    borderRadius: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B2BEC3',
    marginLeft: 6,
  },
  modeButtonTextActive: {
    color: '#6C63FF',
  },
  modeDescription: {
    fontSize: 12,
    color: '#B2BEC3',
    fontStyle: 'italic',
  },
  addressList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  checkboxItemSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8E8EB',
    borderWidth: 2,
    borderColor: '#D1D9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  checkboxInfo: {
    flex: 1,
  },
  checkboxName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  checkboxAddress: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  flag: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  flagStart: {
    backgroundColor: '#00B894',
  },
  flagEnd: {
    backgroundColor: '#FF6B6B',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#E8E8EB',
    marginRight: 8,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#636E72',
  },
  optimizeBtn: {
    backgroundColor: '#6C63FF',
    marginLeft: 8,
  },
  optimizeBtnDisabled: {
    backgroundColor: '#B2BEC3',
  },
  optimizeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
