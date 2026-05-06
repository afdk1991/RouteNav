# 智能路线规划小程序 (Taro 版本)

## 项目结构

```
taro-app/
├── config/           # Taro 配置文件
├── src/
│   ├── pages/        # 页面
│   │   ├── index/    # 首页
│   │   ├── addresses/# 地址管理
│   │   ├── routes/   # 路线规划
│   │   ├── profile/  # 个人中心
│   │   ├── login/    # 登录
│   │   └── register/ # 注册
│   ├── stores/       # Zustand 状态管理
│   └── utils/        # 工具函数
├── package.json
└── project.config.json
```

## 开发命令

```bash
cd taro-app

# 安装依赖
npm install

# 微信小程序开发
npm run dev:weapp

# H5 开发
npm run dev:h5

# 抖音小程序开发
npm run dev:抖音
```

## 功能模块

| 页面 | 功能 |
|------|------|
| 首页 | 统计卡片、快捷操作、优化模式选择 |
| 地址管理 | 添加/删除/搜索地址 |
| 路线规划 | 选择地址、选择模式、生成路线 |
| 个人中心 | 用户信息、设置、退出登录 |
| 登录/注册 | 用户认证 |

## 状态管理 (Zustand)

```ts
import { useUserStore, useAddressStore, useRouteStore } from '@/stores'

// 用户状态
const { userInfo, isAuthenticated, login, logout } = useUserStore()

// 地址状态
const { addresses, selectedAddresses, toggleSelected } = useAddressStore()

// 路线状态
const { currentRoute, setCurrentRoute } = useRouteStore()
```

## 网络请求

```ts
import { Network } from '@/utils/network'

// GET 请求
const res = await Network.get('/api/v1/addresses')

// POST 请求
const res = await Network.post('/api/v1/auth/login', { username, password })

// 文件上传
await Network.uploadFile({ url: '/api/v1/upload', filePath: '...' })
```

## 图标使用

```tsx
import { House, MapPin, Route, Plus } from '@/utils/icons'

<House size={24} color="#3b82f6" />
```

## 小程序配置

### 微信小程序

1. 修改 `project.config.json` 中的 `appid`
2. 运行 `npm run dev:weapp`
3. 使用微信开发者工具导入 `taro-app/dist` 目录

### 抖音小程序

1. 修改 `project.config.json` 配置
2. 运行 `npm run dev:抖音`
3. 使用抖音开发者工具导入

## 注意事项

1. Taro 版本需要 Node.js 16+ 
2. 微信/抖音小程序需要相应的开发者账号
3. 后端 API 地址在 `src/utils/network.ts` 中配置
