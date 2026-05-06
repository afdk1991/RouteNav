import { View, Text, Input, Button, Checkbox } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Plus, Search, MapPin, Trash2 } from '@/utils/icons'
import { Network } from '@/utils/network'
import { useAddressStore, Address } from '@/stores'
import Taro from '@tarojs/taro'
import './index.css'

export default function Addresses() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAddress, setNewAddress] = useState({ name: '', address: '' })
  const { addresses, setAddresses, removeAddress } = useAddressStore()

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await Network.get<Address[]>('/api/v1/addresses')
      setAddresses(res.data)
    } catch (err) {
      console.error('获取地址失败:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await Network.post<Address>('/api/v1/geocode', { query: searchQuery })
      if (res.data) {
        setAddresses([...addresses, res.data])
        setSearchQuery('')
      }
    } catch (err) {
      Taro.showToast({ title: '搜索失败', icon: 'none' })
    }
  }

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.address) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    try {
      await Network.post('/api/v1/addresses', newAddress)
      await fetchAddresses()
      setShowAddModal(false)
      setNewAddress({ name: '', address: '' })
      Taro.showToast({ title: '添加成功' })
    } catch (err) {
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await Network.delete(`/api/v1/addresses/${id}`)
      removeAddress(id)
      Taro.showToast({ title: '删除成功' })
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-6">地址管理</Text>

      {/* 搜索框 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex items-center gap-3">
          <Search size={20} color="#9ca3af" />
          <Input
            className="flex-1"
            placeholder="搜索地址..."
            value={searchQuery}
            onInput={(e) => setSearchQuery(e.detail.value)}
            onConfirm={handleSearch}
          />
          <Button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={handleSearch}>
            搜索
          </Button>
        </View>
      </View>

      {/* 添加按钮 */}
      <Button className="bg-blue-500 text-white rounded-xl mb-4 flex items-center justify-center gap-2" onClick={() => setShowAddModal(true)}>
        <Plus size={20} />
        <Text>添加地址</Text>
      </Button>

      {/* 地址列表 */}
      <View className="space-y-3">
        {addresses.map((item) => (
          <View key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex items-start justify-between">
              <View className="flex items-start gap-3 flex-1">
                <MapPin size={20} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">{item.name}</Text>
                  <Text className="text-sm text-gray-500 mt-1">{item.address}</Text>
                </View>
              </View>
              <View className="flex items-center gap-2">
                <Button className="p-2" onClick={() => handleDelete(item.id)}>
                  <Trash2 size={18} color="#ef4444" />
                </Button>
              </View>
            </View>
          </View>
        ))}

        {addresses.length === 0 && (
          <View className="text-center py-12">
            <Text className="text-gray-400">暂无地址，请添加</Text>
          </View>
        )}
      </View>

      {/* 添加弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <View className="bg-white rounded-2xl w-11/12 max-w-md p-6">
            <Text className="text-xl font-bold mb-4">添加地址</Text>
            <View className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">名称</Text>
                <Input className="border border-gray-200 rounded-lg p-3" placeholder="如：家、公司" value={newAddress.name} onInput={(e) => setNewAddress({ ...newAddress, name: e.detail.value })} />
              </View>
              <View>
                <Text className="text-sm text-gray-600 mb-1">详细地址</Text>
                <Input className="border border-gray-200 rounded-lg p-3" placeholder="如：北京市朝阳区xxx" value={newAddress.address} onInput={(e) => setNewAddress({ ...newAddress, address: e.detail.value })} />
              </View>
            </View>
            <View className="flex gap-3 mt-6">
              <Button className="flex-1 bg-gray-100 text-gray-800" onClick={() => setShowAddModal(false)}>取消</Button>
              <Button className="flex-1 bg-blue-500 text-white" onClick={handleAddAddress}>确定</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

Addresses.config = {
  navigationBarTitleText: '地址管理',
}

Addresses.usingComponents = {}
