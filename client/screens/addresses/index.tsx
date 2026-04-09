/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { AddressItem } from '@/utils/types';
import { getAddresses, createAddress, updateAddress, deleteAddress, geocodeAddress } from '@/utils/api';

interface AddressScreenProps {
  onNavigateToRoute?: () => void;
}

export default function AddressScreen({ onNavigateToRoute }: AddressScreenProps) {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isStart, setIsStart] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    const response = await getAddresses();
    if (response.success && response.data) {
      setAddresses(response.data);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    const response = await geocodeAddress(searchQuery);
    setSearching(false);
    
    if (response.success && response.data) {
      setAddress(response.data.displayName);
      setLatitude(response.data.latitude.toString());
      setLongitude(response.data.longitude.toString());
    } else {
      Alert.alert('错误', response.error || '地址解析失败');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || !latitude || !longitude) {
      Alert.alert('错误', '请填写完整信息');
      return;
    }

    const data = {
      name: name.trim(),
      address: address.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };

    let response;
    if (editingAddress) {
      response = await updateAddress(editingAddress.id, { ...data, isStart, isEnd });
    } else {
      response = await createAddress(data);
    }

    if (response.success) {
      setModalVisible(false);
      resetForm();
      fetchAddresses();
    } else {
      Alert.alert('错误', response.error || '保存失败');
    }
  };

  const handleDelete = (item: AddressItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除地址"${item.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const response = await deleteAddress(item.id);
            if (response.success) {
              fetchAddresses();
            } else {
              Alert.alert('错误', response.error || '删除失败');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setIsStart(false);
    setIsEnd(false);
    setEditingAddress(null);
    setSearchQuery('');
    setBatchMode(false);
    setBatchText('');
  };

  const handleBatchAdd = async () => {
    if (!batchText.trim()) {
      Alert.alert('错误', '请输入地址列表');
      return;
    }

    const lines = batchText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      Alert.alert('错误', '请输入至少一个地址');
      return;
    }

    // 检查格式：每行可以是 "名称,地址" 或只有地址
    const addressesToProcess: string[] = [];
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed) {
        addressesToProcess.push(trimmed);
      }
    });

    if (addressesToProcess.length === 0) {
      Alert.alert('错误', '没有有效的地址');
      return;
    }

    Alert.alert(
      '批量添加确认',
      `将添加 ${addressesToProcess.length} 个地址，是否继续？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '继续',
          onPress: async () => {
            setBatchProcessing(true);
            let successCount = 0;
            let failCount = 0;

            for (const item of addressesToProcess) {
              // 解析格式：可能是 "名称,地址" 或只有地址
              let addrName = '';
              let addrText = item;

              if (item.includes(',')) {
                const parts = item.split(',');
                addrName = parts[0].trim();
                addrText = parts.slice(1).join(',').trim();
              } else {
                addrName = addrText;
              }

              if (!addrName) {
                failCount++;
                continue;
              }

              // 地理编码
              const geoResponse = await geocodeAddress(addrText);
              if (geoResponse.success && geoResponse.data) {
                const createResponse = await createAddress({
                  name: addrName,
                  address: geoResponse.data.displayName,
                  latitude: geoResponse.data.latitude,
                  longitude: geoResponse.data.longitude,
                });
                if (createResponse.success) {
                  successCount++;
                } else {
                  failCount++;
                }
              } else {
                // 如果地理编码失败，创建没有坐标的地址
                const createResponse = await createAddress({
                  name: addrName,
                  address: addrText,
                  latitude: 0,
                  longitude: 0,
                });
                if (createResponse.success) {
                  successCount++;
                } else {
                  failCount++;
                }
              }
            }

            setBatchProcessing(false);

            if (successCount > 0) {
              Alert.alert(
                '添加完成',
                `成功添加 ${successCount} 个地址${failCount > 0 ? `，${failCount} 个失败` : ''}`,
                [{ text: '确定', onPress: () => {
                  setModalVisible(false);
                  resetForm();
                  fetchAddresses();
                }}]
              );
            } else {
              Alert.alert('错误', '添加失败，请重试');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (item: AddressItem) => {
    setEditingAddress(item);
    setName(item.name);
    setAddress(item.address);
    setLatitude(item.latitude.toString());
    setLongitude(item.longitude.toString());
    setIsStart(item.isStart);
    setIsEnd(item.isEnd);
    setModalVisible(true);
  };

  const renderAddressItem = ({ item }: { item: AddressItem }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressContent}>
        <TouchableOpacity
          style={styles.addressMain}
          onPress={() => openEditModal(item)}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <View style={styles.addressIconContainer}>
            <View style={[styles.iconBg, item.isStart && styles.iconStart, item.isEnd && styles.iconEnd]}>
              <Ionicons
                name={item.isStart ? 'flag' : item.isEnd ? 'flag' : 'location'}
                size={20}
                color={item.isStart ? '#00B894' : item.isEnd ? '#FF6B6B' : '#6C63FF'}
              />
            </View>
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{item.name}</Text>
            <Text style={styles.addressDetail} numberOfLines={1}>
              {item.address}
            </Text>
            <View style={styles.addressTags}>
              {item.isStart && (
                <View style={[styles.tag, styles.tagStart]}>
                  <Text style={[styles.tagText, styles.tagTextStart]}>起点</Text>
                </View>
              )}
              {item.isEnd && (
                <View style={[styles.tag, styles.tagEnd]}>
                  <Text style={[styles.tagText, styles.tagTextEnd]}>终点</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>地址管理</Text>
        <Text style={styles.headerSubtitle}>{addresses.length} 个地址</Text>
      </View>

      {/* Address List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#B2BEC3" />
          <Text style={styles.emptyText}>暂无地址</Text>
          <Text style={styles.emptySubtext}>点击下方按钮添加新地址</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <LinearGradient
          colors={['#6C63FF', '#896BFF']}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitle}>
                      {editingAddress ? '编辑地址' : '添加地址'}
                    </Text>
                    {!editingAddress && (
                      <TouchableOpacity
                        style={[styles.modeSwitch, batchMode && styles.modeSwitchActive]}
                        onPress={() => setBatchMode(!batchMode)}
                      >
                        <Text style={[styles.modeSwitchText, batchMode && styles.modeSwitchTextActive]}>
                          {batchMode ? '单个添加' : '批量添加'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {batchMode ? (
                    /* Batch Add Mode */
                    <View style={styles.batchContainer}>
                      <Text style={styles.batchHint}>
                        每行输入一个地址，格式：名称,详细地址
                      </Text>
                      <TextInput
                        style={[styles.input, styles.batchInput]}
                        value={batchText}
                        onChangeText={setBatchText}
                        placeholder={"故宫博物院,北京市东城区景山前街4号\n天安门广场,北京市东城区西长安街\n长城,北京市延庆区八达岭镇"
                        }
                        placeholderTextColor="#B2BEC3"
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                      />
                      <Text style={styles.batchExample}>
                        示例：故宫博物院,北京市东城区景山前街4号
                      </Text>
                    </View>
                  ) : (
                    /* Single Add Mode */
                    <>
                      {/* Name Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>名称</Text>
                        <TextInput
                          style={styles.input}
                          value={name}
                          onChangeText={setName}
                          placeholder="输入地址名称"
                          placeholderTextColor="#B2BEC3"
                        />
                      </View>

                      {/* Search Address */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>搜索地址</Text>
                        <View style={styles.searchRow}>
                          <TextInput
                            style={[styles.input, styles.searchInput]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="输入地址搜索"
                            placeholderTextColor="#B2BEC3"
                          />
                          <TouchableOpacity
                            style={styles.searchBtn}
                            onPress={handleSearchAddress}
                            disabled={searching}
                          >
                            {searching ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <Ionicons name="search" size={20} color="#FFF" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Address Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>详细地址</Text>
                        <TextInput
                          style={styles.input}
                          value={address}
                          onChangeText={setAddress}
                          placeholder="输入详细地址"
                          placeholderTextColor="#B2BEC3"
                        />
                      </View>

                      {/* Coordinates */}
                      <View style={styles.coordRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.inputLabel}>纬度</Text>
                          <TextInput
                            style={styles.input}
                            value={latitude}
                            onChangeText={setLatitude}
                            placeholder="纬度"
                            placeholderTextColor="#B2BEC3"
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                          <Text style={styles.inputLabel}>经度</Text>
                          <TextInput
                            style={styles.input}
                            value={longitude}
                            onChangeText={setLongitude}
                            placeholder="经度"
                            placeholderTextColor="#B2BEC3"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      {/* Flags */}
                      <View style={styles.flagRow}>
                        <TouchableOpacity
                          style={[styles.flagBtn, isStart && styles.flagBtnActive]}
                          onPress={() => setIsStart(!isStart)}
                        >
                          <Ionicons
                            name="flag"
                            size={18}
                            color={isStart ? '#00B894' : '#B2BEC3'}
                          />
                          <Text style={[styles.flagText, isStart && styles.flagTextActive]}>
                            设为起点
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.flagBtn, isEnd && styles.flagBtnActive]}
                          onPress={() => setIsEnd(!isEnd)}
                        >
                          <Ionicons
                            name="flag"
                            size={18}
                            color={isEnd ? '#FF6B6B' : '#B2BEC3'}
                          />
                          <Text style={[styles.flagText, isEnd && styles.flagTextActive]}>
                            设为终点
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.cancelBtn]}
                      onPress={() => {
                        setModalVisible(false);
                        resetForm();
                      }}
                    >
                      <Text style={styles.cancelBtnText}>取消</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.saveBtn]}
                      onPress={batchMode ? handleBatchAdd : handleSave}
                      disabled={batchProcessing}
                    >
                      {batchProcessing ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>{batchMode ? '批量添加' : '保存'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  </View>
                </ScrollView>
          </KeyboardAvoidingView>
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
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  addressContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconContainer: {
    marginRight: 14,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStart: {
    backgroundColor: 'rgba(0, 184, 148, 0.12)',
  },
  iconEnd: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  addressDetail: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 4,
  },
  addressTags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
  },
  tagStart: {
    backgroundColor: 'rgba(0, 184, 148, 0.12)',
  },
  tagEnd: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextStart: {
    color: '#00B894',
  },
  tagTextEnd: {
    color: '#FF6B6B',
  },
  deleteBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#E8E8EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordRow: {
    flexDirection: 'row',
  },
  flagRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  flagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8EB',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  flagBtnActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  flagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B2BEC3',
    marginLeft: 8,
  },
  flagTextActive: {
    color: '#6C63FF',
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
  saveBtn: {
    backgroundColor: '#6C63FF',
    marginLeft: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modeSwitch: {
    backgroundColor: '#E8E8EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modeSwitchActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  modeSwitchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
  },
  modeSwitchTextActive: {
    color: '#6C63FF',
  },
  batchContainer: {
    marginBottom: 16,
  },
  batchHint: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 12,
  },
  batchInput: {
    height: 180,
    paddingTop: 16,
  },
  batchExample: {
    fontSize: 12,
    color: '#B2BEC3',
    marginTop: 8,
  },
  addressMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
