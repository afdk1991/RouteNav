import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import { Network } from '@/utils/network'
import { useUserStore } from '@/stores'
import Taro from '@tarojs/taro'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useUserStore()

  const handleLogin = async () => {
    if (!username || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await Network.post('/api/v1/auth/login', { username, password })
      if (res.data?.token) {
        login(res.data.user, res.data.token)
        Taro.showToast({ title: '登录成功' })
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1000)
      }
    } catch (err) {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <View className="text-center mb-10">
        <Text className="text-3xl font-bold text-gray-800">智能路线规划</Text>
        <Text className="text-gray-500 mt-2">登录您的账户</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-lg">
        <View className="space-y-4">
          <View>
            <Text className="text-sm text-gray-600 mb-2">用户名 / 邮箱</Text>
            <Input
              className="border border-gray-200 rounded-xl p-4"
              placeholder="请输入用户名或邮箱"
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-2">密码</Text>
            <Input
              className="border border-gray-200 rounded-xl p-4"
              type="password"
              placeholder="请输入密码"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <Button
            className={`rounded-xl py-4 font-semibold ${loading ? 'bg-gray-400' : 'bg-blue-500 text-white'}`}
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <View className="flex justify-between text-sm">
            <Text className="text-blue-500" onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>
              注册账号
            </Text>
            <Text className="text-gray-400">忘记密码?</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

Login.config = {
  navigationBarTitleText: '登录',
}

Login.usingComponents = {}
