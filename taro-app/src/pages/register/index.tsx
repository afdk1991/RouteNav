import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import { Network } from '@/utils/network'
import Taro from '@tarojs/taro'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await Network.post('/api/v1/auth/register', { username, email, password })
      Taro.showToast({ title: '注册成功' })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pages/login/index' })
      }, 1000)
    } catch (err) {
      Taro.showToast({ title: '注册失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <View className="text-center mb-10">
        <Text className="text-3xl font-bold text-gray-800">创建账号</Text>
        <Text className="text-gray-500 mt-2">加入智能路线规划</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-lg">
        <View className="space-y-4">
          <View>
            <Text className="text-sm text-gray-600 mb-2">用户名</Text>
            <Input
              className="border border-gray-200 rounded-xl p-4"
              placeholder="请输入用户名"
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-2">邮箱</Text>
            <Input
              className="border border-gray-200 rounded-xl p-4"
              type="text"
              placeholder="请输入邮箱"
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
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
          <View>
            <Text className="text-sm text-gray-600 mb-2">确认密码</Text>
            <Input
              className="border border-gray-200 rounded-xl p-4"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.detail.value)}
            />
          </View>

          <Button
            className={`rounded-xl py-4 font-semibold ${loading ? 'bg-gray-400' : 'bg-blue-500 text-white'}`}
            disabled={loading}
            onClick={handleRegister}
          >
            {loading ? '注册中...' : '注册'}
          </Button>

          <View className="text-center text-sm">
            <Text className="text-gray-400">已有账号？</Text>
            <Text className="text-blue-500" onClick={() => Taro.navigateBack()}>去登录</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

Register.config = {
  navigationBarTitleText: '注册',
}

Register.usingComponents = {}
