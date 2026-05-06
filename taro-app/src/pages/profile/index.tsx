import { View, Text, Button } from '@tarojs/components'
import { User, Settings, Info, LogOut } from '@/utils/icons'
import { useUserStore } from '@/stores'
import Taro from '@tarojs/taro'

export default function Profile() {
  const { userInfo, isAuthenticated, logout } = useUserStore()

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  if (!isAuthenticated) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <View className="text-center">
          <Text className="text-gray-400 mb-4">请先登录</Text>
          <Button className="bg-blue-500 text-white px-8 py-3 rounded-xl" onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
            去登录
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 用户信息卡片 */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-12">
        <View className="flex items-center gap-4">
          <View className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} color="white" />
          </View>
          <View>
            <Text className="text-white text-xl font-bold">{userInfo?.name || userInfo?.username}</Text>
            <Text className="text-blue-100 text-sm mt-1">{userInfo?.email}</Text>
          </View>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className="px-4 mt-4 space-y-3">
        <View className="bg-white rounded-xl shadow-sm">
          <View className="flex items-center justify-between p-4 border-b border-gray-100">
            <View className="flex items-center gap-3">
              <Settings size={20} color="#6b7280" />
              <Text className="text-gray-800">设置</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </View>
          <View className="flex items-center justify-between p-4 border-b border-gray-100">
            <View className="flex items-center gap-3">
              <Info size={20} color="#6b7280" />
              <Text className="text-gray-800">关于</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </View>
        </View>

        {/* 退出登录 */}
        <Button className="bg-white rounded-xl shadow-sm p-4 text-red-500" onClick={handleLogout}>
          <View className="flex items-center justify-center gap-3">
            <LogOut size={20} color="#ef4444" />
            <Text>退出登录</Text>
          </View>
        </Button>
      </View>

      {/* 版本信息 */}
      <View className="text-center mt-8">
        <Text className="text-gray-400 text-sm">版本 1.0.0</Text>
      </View>
    </View>
  )
}

Profile.config = {
  navigationBarTitleText: '我的',
}

Profile.usingComponents = {}
