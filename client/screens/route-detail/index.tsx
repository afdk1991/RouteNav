/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import type { RouteItem, AddressItem } from '@/utils/types';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 72;
const ITEM_MARGIN = 8;

// Helper function outside component
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}

interface DraggableItemProps {
  item: AddressItem;
  index: number;
  total: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function DraggableItem({
  item,
  index,
  total,
  isDragging,
  onDragStart,
  onDragEnd,
}: DraggableItemProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          onDragStart();
          Animated.spring(scaleAnim, {
            toValue: 1.03,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: Animated.event([null, { dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
          onDragEnd();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Animated.View
      style={[
        styles.dragItem,
        isDragging && styles.dragItemActive,
        {
          transform: [
            { translateY: pan.y },
            { scale: scaleAnim },
          ],
          zIndex: isDragging ? 100 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.dragHandle}>
        <Ionicons name="menu" size={20} color="#B2BEC3" />
      </View>
      
      <View style={styles.dragIndexContainer}>
        <LinearGradient
          colors={index === 0 ? ['#00B894', '#00CEC9'] : ['#6C63FF', '#896BFF']}
          style={styles.dragIndexBadge}
        >
          <Text style={styles.dragIndexText}>{index + 1}</Text>
        </LinearGradient>
      </View>

      <View style={styles.dragContent}>
        <Text style={styles.dragName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.dragAddress} numberOfLines={1}>
          {item.address}
        </Text>
      </View>

      {index === 0 && (
        <View style={styles.startBadge}>
          <Text style={styles.startBadgeText}>起点</Text>
        </View>
      )}
      {index === total - 1 && (
        <View style={[styles.endBadge, styles.startBadge]}>
          <Text style={styles.startBadgeText}>终点</Text>
        </View>
      )}

      <View style={styles.dragArrow}>
        <Ionicons name="chevron-up" size={16} color="#B2BEC3" />
        <Ionicons name="chevron-down" size={16} color="#B2BEC3" />
      </View>
    </Animated.View>
  );
}

interface RouteDetailScreenProps {
  route?: RouteItem;
  onRouteUpdate?: (updatedRoute: RouteItem) => void;
}

export default function RouteDetailScreen({ route: propRoute, onRouteUpdate }: RouteDetailScreenProps) {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ route?: string }>();
  
  // Get route from props or params
  const initialRoute = propRoute || (params.route ? JSON.parse(params.route) : null);
  const [addresses, setAddresses] = useState<AddressItem[]>(initialRoute?.orderedAddresses || []);
  const [originalRoute, setOriginalRoute] = useState<RouteItem | null>(initialRoute);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [hasChanges, setHasChanges] = useState(false);

  // Update addresses when route changes
  useEffect(() => {
    if (params.route) {
      const parsedRoute: RouteItem = JSON.parse(params.route);
      setAddresses(parsedRoute.orderedAddresses);
      setOriginalRoute(parsedRoute);
    }
  }, [params.route]);

  // Calculate total distance
  const calculateTotalDistance = useCallback((items: AddressItem[]) => {
    let total = 0;
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i];
      const b = items[i + 1];
      total += haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    }
    return total.toFixed(2);
  }, []);

  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggingIndex(-1);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newAddresses = [...addresses];
    [newAddresses[index - 1], newAddresses[index]] = [newAddresses[index], newAddresses[index - 1]];
    setAddresses(newAddresses);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index >= addresses.length - 1) return;
    const newAddresses = [...addresses];
    [newAddresses[index], newAddresses[index + 1]] = [newAddresses[index + 1], newAddresses[index]];
    setAddresses(newAddresses);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (!originalRoute) return;
    Alert.alert(
      '确认重置',
      '确定要恢复到原始顺序吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          onPress: () => {
            setAddresses(originalRoute.orderedAddresses);
            setHasChanges(false);
          },
        },
      ]
    );
  };

  const handleSave = () => {
    if (!originalRoute) return;
    const updatedRoute: RouteItem = {
      ...originalRoute,
      orderedAddresses: addresses,
      totalDistance: parseFloat(calculateTotalDistance(addresses)),
    };
    
    if (onRouteUpdate) {
      onRouteUpdate(updatedRoute);
    }
    
    Alert.alert('保存成功', '路线顺序已更新', [
      {
        text: '确定',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleStartNavigation = () => {
    if (!originalRoute) return;
    const updatedRoute: RouteItem = {
      ...originalRoute,
      orderedAddresses: addresses,
      totalDistance: parseFloat(calculateTotalDistance(addresses)),
    };
    
    if (onRouteUpdate) {
      onRouteUpdate(updatedRoute);
    }
    
    router.push('/navigate', { route: JSON.stringify(updatedRoute) });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>调整路线顺序</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh" size={22} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Route Info */}
      <View style={styles.routeInfo}>
        <View style={styles.routeInfoLeft}>
          <Text style={styles.routeName}>{originalRoute?.name || '路线详情'}</Text>
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={16} color="#636E72" />
              <Text style={styles.statText}>{addresses.length} 个地点</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="analytics" size={16} color="#636E72" />
              <Text style={styles.statText}>
                {hasChanges ? calculateTotalDistance(addresses) : originalRoute?.totalDistance || '0'} 公里
              </Text>
            </View>
          </View>
        </View>
        {hasChanges && (
          <View style={styles.changedBadge}>
            <Text style={styles.changedBadgeText}>已修改</Text>
          </View>
        )}
      </View>

      {/* Instruction */}
      <View style={styles.instruction}>
        <Ionicons name="hand-left" size={18} color="#6C63FF" />
        <Text style={styles.instructionText}>
          点击上下箭头调整地点顺序，起点和终点固定
        </Text>
      </View>

      {/* Draggable List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {addresses.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.itemWrapper}>
            {/* Move Buttons - placed BEFORE DraggableItem for better touch stacking */}
            <View style={styles.moveButtons}>
              <TouchableOpacity
                style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-up"
                  size={20}
                  color={index === 0 ? '#E0E0E0' : '#6C63FF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moveBtn, index === addresses.length - 1 && styles.moveBtnDisabled]}
                onPress={() => handleMoveDown(index)}
                disabled={index === addresses.length - 1}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={index === addresses.length - 1 ? '#E0E0E0' : '#6C63FF'}
                />
              </TouchableOpacity>
            </View>
            
            <DraggableItem
              item={item}
              index={index}
              total={addresses.length}
              isDragging={draggingIndex === index}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
            />
          </View>
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.saveBtnGradient}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>保存</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navBtn} onPress={handleStartNavigation}>
          <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.navBtnGradient}>
            <Ionicons name="navigate" size={20} color="#FFF" />
            <Text style={styles.navBtnText}>开始导航</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  routeInfoLeft: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 13,
    color: '#636E72',
    marginLeft: 4,
  },
  changedBadge: {
    backgroundColor: '#FDCB6E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3436',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#6C63FF',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ITEM_MARGIN,
    zIndex: 1,
  },
  dragItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    height: ITEM_HEIGHT,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dragItemActive: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dragIndexContainer: {
    marginRight: 12,
  },
  dragIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndexText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  dragContent: {
    flex: 1,
  },
  dragName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  dragAddress: {
    fontSize: 12,
    color: '#636E72',
  },
  startBadge: {
    backgroundColor: '#00B894',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  endBadge: {
    backgroundColor: '#E17055',
  },
  startBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  dragArrow: {
    width: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  moveButtons: {
    flexDirection: 'column',
    marginLeft: 8,
  },
  moveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  moveBtnDisabled: {
    backgroundColor: '#F0F0F3',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: {
    flex: 1,
    marginRight: 12,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
  navBtn: {
    flex: 1,
  },
  navBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 8,
  },
});
