import { View, Text, Button, Checkbox } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Route, MapPin, Play, Navigation } from '@/utils/icons'
import { Network } from '@/utils/network'
import { useAddressStore, useRouteStore, OptimizedRoute } from '@/stores'
import Taro from '@tarojs/taro'

export default function Routes() {
  const [mode, setMode] = useState<'greedy' | 'balanced' | 'region'>('greedy')
  const [optimizing, setOptimizing] = useState(false)
  const { addresses, selectedAddresses, toggleSelected, clearSelection } = useAddressStore()
  const { setCurrentRoute } = useRouteStore()

  useEffect(() => {
    // 从 URL 参数获取模式
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as any).options || {}
    if (options.mode) {
      setMode(options.mode as any)
    }
  }, [])

  const handleOptimize = async () => {
    if (selectedAddresses.length < 2) {
      Taro.showToast({ title: '请至少选择2个地址', icon: 'none' })
      return
    }

    setOptimizing(true)
    try {
      const res = await Network.post<OptimizedRoute>('/api/v1/routes/optimize', {
        addressIds: selectedAddresses,
        mode,
      })
      setCurrentRoute(res.data)
      clearSelection()
      Taro.navigateTo({ url: `/pages/route-detail/index?id=${res.data.id}` })
    } catch (err) {
      Taro.showToast({ title: '优化失败', icon: 'none' })
    } finally {
      setOptimizing(false)
    }
  }

  const modeOptions = [
    { key: 'greedy' as const, label: '最短距离', desc: '贪心算法' },
    { key: 'balanced' as const, label: '均衡路线', desc: '2-opt优化' },
    { key: 'region' as const, label: '区域扫描', desc: '分区域规划' },
  ]

  return (
    <View className="min-h-screen bg-gray-50 p-4 pb-24">
      <Text className="text-2xl font-bold text-gray-800 mb-6">路线规划</Text>

      {/* 优化模式选择 */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="font-semibold text-gray-800 mb-3">优化模式</Text>
        <View className="flex gap-2">
          {modeOptions.map((item) => (
            <View
              key={item.key}
              className={`flex-1 p-3 rounded-xl text-center ${mode === item.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setMode(item.key)}
            >
              <Text className="font-medium">{item.label}</Text>
              <Text className={`text-xs mt-1 ${mode === item.key ? 'text-blue-100' : 'text-gray-400'}`}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 选中地址列表 */}
      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="font-semibold text-gray-800">选择地址 ({selectedAddresses.length})</Text>
          {selectedAddresses.length > 0 && (
            <Text className="text-blue-500 text-sm" onClick={clearSelection}>清空</Text>
          )}
        </View>

        {addresses.map((item, index) => (
          <View key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
            <Checkbox checked={selectedAddresses.includes(item.id)} onChange={() => toggleSelected(item.id)} />
            <View className="flex items-start gap-2 flex-1" onClick={() => toggleSelected(item.id)}>
              <MapPin size={16} color="#3b82f6" />
              <View>
                <Text className="text-gray-800">{item.name}</Text>
                <Text className="text-xs text-gray-500">{item.address}</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-sm">#{index + 1}</Text>
          </View>
        ))}

        {addresses.length === 0 && (
          <View className="text-center py-8">
            <Text className="text-gray-400">暂无地址，请先添加</Text>
          </View>
        )}
      </View>

      {/* 优化按钮 */}
      <View className="fixed bottom-4 left-4 right-4">
        <Button
          className={`rounded-xl py-4 font-semibold ${selectedAddresses.length >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}
          disabled={selectedAddresses.length < 2 || optimizing}
          onClick={handleOptimize}
        >
          {optimizing ? '优化中...' : `开始优化 (${selectedAddresses.length}个地址)`}
        </Button>
      </View>
    </View>
  )
}

Routes.config = {
  navigationBarTitleText: '路线规划',
}

Routes.usingComponents = {}
