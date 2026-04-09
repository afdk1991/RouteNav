import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useSafeRouter();

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };
  const systemColorScheme = useColorScheme();
  const [notifications, setNotifications] = useState(true);
  const [locationPermission, setLocationPermission] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有缓存数据吗？这不会影响已保存的地址和路线。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => {
            Alert.alert('提示', '缓存已清除');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      '关于应用',
      '智能路线规划 APP\n\n版本: 1.0.0\n\n一款帮助您规划最优路线的应用，支持多种优化算法。',
      [{ text: '确定' }]
    );
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:support@routeplanner.app');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.profileAvatar}>
          <Ionicons name="navigate" size={32} color="#FFF" />
        </LinearGradient>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.username || '路线规划用户'}</Text>
          <Text style={styles.profileDesc}>{user?.email || '开始规划您的路线吧'}</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>设置</Text>

        <View style={styles.settingsCard}>
          {/* Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(108, 99, 255, 0.12)' }]}>
                <Ionicons name="notifications" size={20} color="#6C63FF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>推送通知</Text>
                <Text style={styles.settingDesc}>接收路线更新提醒</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E8E8EB', true: '#6C63FF' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.settingDivider} />

          {/* Location Permission */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(0, 184, 148, 0.12)' }]}>
                <Ionicons name="location" size={20} color="#00B894" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>位置权限</Text>
                <Text style={styles.settingDesc}>实时导航需要此权限</Text>
              </View>
            </View>
            <Switch
              value={locationPermission}
              onValueChange={setLocationPermission}
              trackColor={{ false: '#E8E8EB', true: '#6C63FF' }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>

        <View style={styles.settingsCard}>
          {/* Clear Cache */}
          <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(253, 203, 110, 0.12)' }]}>
                <Ionicons name="trash" size={20} color="#FDCB6E" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>清除缓存</Text>
                <Text style={styles.settingDesc}>释放存储空间</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B2BEC3" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* Export Data */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(0, 184, 148, 0.12)' }]}>
                <Ionicons name="download" size={20} color="#00B894" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>导出数据</Text>
                <Text style={styles.settingDesc}>导出地址和路线</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B2BEC3" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>支持</Text>

        <View style={styles.settingsCard}>
          {/* Feedback */}
          <TouchableOpacity style={styles.settingItem} onPress={handleFeedback}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(255, 101, 132, 0.12)' }]}>
                <Ionicons name="chatbox-ellipses" size={20} color="#FF6584" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>意见反馈</Text>
                <Text style={styles.settingDesc}>帮助我们改进应用</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B2BEC3" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* About */}
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(108, 99, 255, 0.12)' }]}>
                <Ionicons name="information-circle" size={20} color="#6C63FF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>关于应用</Text>
                <Text style={styles.settingDesc}>版本 1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B2BEC3" />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* Privacy Policy */}
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(116, 185, 255, 0.12)' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#74B9FF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>隐私政策</Text>
                <Text style={styles.settingDesc}>了解我们如何保护您的数据</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B2BEC3" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>功能特点</Text>

        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <LinearGradient colors={['#6C63FF', '#896BFF']} style={styles.featureIconBg}>
              <Ionicons name="analytics" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureText}>TSP优化算法</Text>
          </View>

          <View style={styles.featureItem}>
            <LinearGradient colors={['#FF6584', '#FF8A80']} style={styles.featureIconBg}>
              <Ionicons name="speedometer" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureText}>最短距离</Text>
          </View>

          <View style={styles.featureItem}>
            <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.featureIconBg}>
              <Ionicons name="location" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureText}>实时定位</Text>
          </View>

          <View style={styles.featureItem}>
            <LinearGradient colors={['#FDCB6E', '#F39C12']} style={styles.featureIconBg}>
              <Ionicons name="map" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={styles.featureText}>多地图支持</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 120 }} />
    </ScrollView>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  profileDesc: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  settingDesc: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E8E8EB',
    marginHorizontal: 12,
  },
  featuresCard: {
    backgroundColor: '#F0F0F3',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#D1D9E6',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#636E72',
  },
});
