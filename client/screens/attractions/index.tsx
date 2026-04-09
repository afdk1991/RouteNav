/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AttractionItem } from '@/utils/api';
import { getAttractions, addAttractionToAddress, addAttractionsToAddresses } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

const CITIES = ['全部', '北京', '上海', '广州', '深圳'];
const CATEGORIES = ['全部', '景点', '商场', '地标'];

export default function AttractionsScreen() {
  const router = useSafeRouter();
  const [attractions, setAttractions] = useState<AttractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('全部');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchAttractions = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCity !== '全部') params.city = selectedCity;
    if (selectedCategory !== '全部') params.category = selectedCategory;
    params.limit = '50';

    const response = await getAttractions(params);
    if (response.success && response.data) {
      setAttractions(response.data.items);
    }
    setLoading(false);
  }, [searchQuery, selectedCity, selectedCategory]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchAttractions();
  }, [fetchAttractions]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddOne = async (attraction: AttractionItem) => {
    const response = await addAttractionToAddress(attraction.id);
    if (response.success) {
      Alert.alert('添加成功', `已将"${attraction.name}"添加到地址列表`);
    } else {
      Alert.alert('添加失败', response.error || '未知错误');
    }
  };

  const handleBatchAdd = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('提示', '请至少选择一个景点');
      return;
    }

    Alert.alert(
      '批量添加',
      `将添加 ${selectedIds.length} 个景点到地址列表`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            setAdding(true);
            const response = await addAttractionsToAddresses(selectedIds);
            setAdding(false);

            if (response.success && response.data) {
              Alert.alert(
                '添加成功',
                `已添加 ${response.data.added} 个景点到地址列表`,
                [{ text: '确定', onPress: () => router.back() }]
              );
            } else {
              Alert.alert('添加失败', response.error || '未知错误');
            }
          }
        }
      ]
    );
  };

  const renderAttractionItem = ({ item }: { item: AttractionItem }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.attractionCard, isSelected && styles.attractionCardSelected]}
        onPress={() => batchMode ? toggleSelect(item.id) : handleAddOne(item)}
        activeOpacity={0.7}
      >
        {batchMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
        )}
        <View style={styles.attractionContent}>
          <View style={styles.attractionHeader}>
            <Text style={styles.attractionName}>{item.name}</Text>
            <View style={[
              styles.categoryTag,
              item.category === '景点' && styles.categoryPano,
              item.category === '商场' && styles.categoryShop,
              item.category === '地标' && styles.categoryLandmark,
            ]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
          <Text style={styles.attractionAddress} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#B2BEC3" />
            {' '}{item.address}
          </Text>
          <Text style={styles.attractionCity}>
            <Ionicons name="business-outline" size={12} color="#B2BEC3" />
            {' '}{item.city}
          </Text>
        </View>
        {!batchMode && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAddOne(item)}
          >
            <Ionicons name="add" size={20} color="#6C63FF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2D3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>选择景点</Text>
          <TouchableOpacity
            style={[styles.batchToggle, batchMode && styles.batchToggleActive]}
            onPress={() => {
              setBatchMode(!batchMode);
              setSelectedIds([]);
            }}
          >
            <Text style={[styles.batchToggleText, batchMode && styles.batchToggleTextActive]}>
              {batchMode ? '取消' : '批量'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color="#B2BEC3" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索景点名称"
              placeholderTextColor="#B2BEC3"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#B2BEC3" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* City Filter */}
        <FlatList
          horizontal
          data={CITIES}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCity === item && styles.filterChipActive]}
              onPress={() => setSelectedCity(item)}
            >
              <Text style={[styles.filterText, selectedCity === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Category Filter */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === item && styles.filterChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.filterText, selectedCategory === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Attraction List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : (
          <FlatList
            data={attractions}
            keyExtractor={item => item.id.toString()}
            renderItem={renderAttractionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#B2BEC3" />
                <Text style={styles.emptyText}>未找到相关景点</Text>
              </View>
            }
          />
        )}

        {/* Bottom Action */}
        {batchMode && selectedIds.length > 0 && (
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.batchAddBtn}
              onPress={handleBatchAdd}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.batchAddBtnText}>
                  添加已选 ({selectedIds.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  batchToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  batchToggleActive: {
    backgroundColor: '#6C63FF',
  },
  batchToggleText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
  batchToggleTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#2D3436',
  },
  filterList: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6C63FF',
  },
  filterText: {
    fontSize: 14,
    color: '#636E72',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  attractionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  attractionCardSelected: {
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B2BEC3',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  attractionContent: {
    flex: 1,
  },
  attractionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  categoryPano: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  categoryShop: {
    backgroundColor: 'rgba(255, 101, 132, 0.1)',
  },
  categoryLandmark: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  categoryText: {
    fontSize: 11,
    color: '#636E72',
    fontWeight: '500',
  },
  attractionAddress: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 4,
  },
  attractionCity: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#B2BEC3',
    marginTop: 12,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: '#F0F0F3',
  },
  batchAddBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  batchAddBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
