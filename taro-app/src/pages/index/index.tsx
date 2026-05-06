import { View, Text, Button } from '@tarojs/components'
import { House, MapPin, Route, Plus, Compass } from '@/utils/icons'
import { useUserStore } from '@/stores'
import './index.css'

export default function Index() {
  const { userInfo, isAuthenticated } = useUserStore()

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 顶部 Hero */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-12">
        <Text className="text-white text-3xl font-bold">智能路线规划</Text>
        <Text className="text-blue-100 mt-2 text-base">
          {isAuthenticated ? `欢迎回来，${userInfo?.name || userInfo?.username}` : '规划您的完美行程'}
        </Text>
      </View>

      {/* 统计卡片 */}
      <View className="px-4 -mt-6">
        <View className="bg-white rounded-2xl shadow-lg p-6">
          <View className="flex flex-row justify-around">
            <View className="items-center">
              <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <MapPin size={24} color="#3b82f6" />
              </View>
              <Text className="text-gray-500 text-sm">地址</Text>
              <Text className="text-2xl font-bold text-gray-800">0</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Route size={24} color="#22c55e" />
              </View>
              <Text className="text-gray-500 text-sm">路线</Text>
              <Text className="text-2xl font-bold text-gray-800">0</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Compass size={24} color="#f97316" />
              </View>
              <Text className="text-gray-500 text-sm">公里</Text>
              <Text className="text-2xl font-bold text-gray-800">0</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 快速操作 */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">快捷操作</Text>
        <View className="flex flex-row gap-4">
          <View className="flex-1">
            <Button className="bg-blue-500 text-white rounded-xl py-4" onClick={() => Taro.navigateTo({ url: '/pages/addresses/index' })}>
              <View className="flex items-center justify-center gap-2">
                <Plus size={20} />
                <Text>添加地址</Text>
              </View>
            </Button>
          </View>
          <View className="flex-1">
            <Button className="bg-green-500 text-white rounded-xl py-4" onClick={() => Taro.navigateTo({ url: '/pages/routes/index' })}>
              <View className="flex items-center justify-center gap-2">
                <Route size={20} />
                <Text>规划路线</Text>
              </View>
            </Button>
          </View>
        </View>
      </View>

      {/* 优化模式 */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold text-gray-800 mb-4">选择优化模式</Text>
        <View className="grid grid-cols-3 gap-3">
          <View className="bg-white rounded-xl p-4 shadow-sm" onClick={() => Taro.navigateTo({ url: '/pages/routes/index?mode=greedy' })}>
            <Text className="text-2xl mb-2">📏</Text>
            <Text className="font-medium text-gray-800">最短距离</Text>
            <Text className="text-xs text-gray-500 mt-1">贪心算法</Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm" onClick={() => Taro.navigateTo({ url: '/pages/routes/index?mode=balanced' })}>
            <Text className="text-2xl mb-2">⚖️</Text>
            <Text className="font-medium text-gray-800">均衡路线</Text>
            <Text className="text-xs text-gray-500 mt-1">2-opt优化</Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm" onClick={() => Taro.navigateTo({ url: '/pages/routes/index?mode=region' })}>
            <Text className="text-2xl mb-2">🗺️</Text>
            <Text className="font-medium text-gray-800">区域扫描</Text>
            <Text className="text-xs text-gray-500 mt-1">分区域规划</Text>
          </View>
        </View>
      </View>

      {/* 底部 Tab */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex flex-row justify-around">
        <View className="items-center" onClick={() => {}}>
          <House size={24} color="#3b82f6" />
          <Text className="text-xs text-blue-500 mt-1">首页</Text>
        </View>
        <View className="items-center" onClick={() => Taro.navigateTo({ url: '/pages/addresses/index' })}>
          <MapPin size={24} color="#6b7280" />
          <Text className="text-xs text-gray-500 mt-1">地址</Text>
        </View>
        <View className="items-center" onClick={() => Taro.navigateTo({ url: '/pages/routes/index' })}>
          <Route size={24} color="#6b7280" />
          <Text className="text-xs text-gray-500 mt-1">路线</Text>
        </View>
        <View className="items-center" onClick={() => Taro.switchTab({ url: '/pages/profile/index' })}>
          <Text className="text-xs text-gray-500 mt-1">我的</Text>
        </View>
      </View>
    </View>
  )
}

Index.config = {
  navigationBarTitleText: '首页',
  enablePullDownRefresh: true,
}

Index.usingComponents = {}
