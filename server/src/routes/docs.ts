import { Router } from 'express'

const router = Router()

/**
 * @api {get} /api/v1 API文档
 * @apiName GetDocs
 * @apiGroup Documentation
 * @apiDescription 返回API接口文档
 */
router.get('/', (req, res) => {
  const docs = {
    name: 'Route Planner API',
    version: '1.0.0',
    description: '智能路线规划与导航API',
    baseUrl: '/api/v1',
    endpoints: [
      // 健康检查
      {
        method: 'GET',
        path: '/health',
        description: '健康检查',
        response: { status: 'ok', timestamp: new Date().toISOString() },
      },

      // 认证
      {
        group: '认证 (Authentication)',
        endpoints: [
          {
            method: 'POST',
            path: '/auth/register',
            description: '用户注册',
            body: { username: 'string', email: 'string', password: 'string' },
            response: { id: 1, username: 'string', email: 'string', token: 'string' },
          },
          {
            method: 'POST',
            path: '/auth/login',
            description: '用户登录',
            body: { username: 'string', password: 'string' },
            response: { token: 'string', user: { id: 1, username: 'string', email: 'string' } },
          },
          {
            method: 'GET',
            path: '/auth/me',
            description: '获取当前用户信息',
            auth: true,
            response: { id: 1, username: 'string', email: 'string' },
          },
        ],
      },

      // 地址
      {
        group: '地址管理 (Addresses)',
        endpoints: [
          {
            method: 'GET',
            path: '/addresses',
            description: '获取用户地址列表',
            auth: true,
            response: { addresses: [{ id: 1, name: 'string', address: 'string', latitude: 0, longitude: 0 }] },
          },
          {
            method: 'POST',
            path: '/addresses',
            description: '创建新地址',
            auth: true,
            body: { name: 'string', address: 'string', latitude: 0, longitude: 0 },
            response: { id: 1, name: 'string', address: 'string' },
          },
          {
            method: 'PUT',
            path: '/addresses/:id',
            description: '更新地址',
            auth: true,
            params: { id: 'number' },
            body: { name: 'string', address: 'string' },
          },
          {
            method: 'DELETE',
            path: '/addresses/:id',
            description: '删除地址',
            auth: true,
            params: { id: 'number' },
          },
          {
            method: 'POST',
            path: '/addresses/from-attraction/:id',
            description: '从景点添加地址',
            auth: true,
            params: { id: 'number (景点ID)' },
          },
          {
            method: 'POST',
            path: '/addresses/from-attractions',
            description: '批量从景点添加地址',
            auth: true,
            body: { attractionIds: 'number[]' },
          },
        ],
      },

      // 路线
      {
        group: '路线规划 (Routes)',
        endpoints: [
          {
            method: 'GET',
            path: '/routes',
            description: '获取用户路线列表',
            auth: true,
            response: { routes: [{ id: 1, name: 'string', mode: 'greedy|balanced|region' }] },
          },
          {
            method: 'POST',
            path: '/routes/optimize',
            description: '优化路线',
            auth: true,
            body: { addressIds: 'number[]', mode: 'greedy|balanced|region' },
            response: { optimizedOrder: 'number[]', totalDistance: 'number' },
          },
          {
            method: 'DELETE',
            path: '/routes/:id',
            description: '删除路线',
            auth: true,
            params: { id: 'number' },
          },
        ],
      },

      // 地理编码
      {
        group: '地理编码 (Geocoding)',
        endpoints: [
          {
            method: 'POST',
            path: '/geocode',
            description: '地址转坐标',
            body: { query: 'string' },
            response: { latitude: 'number', longitude: 'number', displayName: 'string' },
          },
          {
            method: 'POST',
            path: '/reverse-geocode',
            description: '坐标转地址',
            body: { latitude: 'number', longitude: 'number' },
            response: { address: 'string', displayName: 'string' },
          },
        ],
      },

      // 景点
      {
        group: '景点 (Attractions)',
        endpoints: [
          {
            method: 'GET',
            path: '/attractions',
            description: '获取景点列表',
            query: { city: 'string (可选)', category: 'string (可选)', limit: 'number' },
            response: { attractions: [{ id: 1, name: 'string', city: 'string', latitude: 0, longitude: 0 }] },
          },
          {
            method: 'GET',
            path: '/attractions/cities',
            description: '获取支持的城市列表',
            response: { cities: ['string'] },
          },
        ],
      },

      // 导航
      {
        group: '导航 (Navigation)',
        endpoints: [
          {
            method: 'POST',
            path: '/distance',
            description: '计算两点间距离',
            body: { from: { latitude: 0, longitude: 0 }, to: { latitude: 0, longitude: 0 } },
            response: { distance: 'number (米)', duration: 'number (秒)' },
          },
          {
            method: 'POST',
            path: '/external-map-url',
            description: '生成外部地图跳转链接',
            body: { latitude: 'number', longitude: 'number', name: 'string', provider: 'amap|baidu|google|apple' },
            response: { url: 'string', deepLink: 'string' },
          },
        ],
      },
    ],
    notes: {
      authentication: '除健康检查外，所有接口需要在请求头中携带 Token: Authorization: Bearer <token>',
      errorFormat: '错误响应格式: { success: false, error: { code: "string", message: "string" } }',
      successFormat: '成功响应格式: { success: true, data: <response> }',
    },
  }

  res.json(docs)
})

export default router
