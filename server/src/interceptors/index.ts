import type { Request, Response, NextFunction } from 'express'

/**
 * HTTP 状态码统一拦截器
 * 将 POST 请求的默认状态码从 201 改为 200
 * 保持 API 响应的一致性
 */
export function httpStatusInterceptor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 拦截响应，修改 POST 请求的默认状态码
  const originalStatus = res.status

  res.status = function(code: number) {
    // POST 请求默认返回 200 而不是 201
    if (code === 201 && req.method === 'POST') {
      code = 200
    }
    return originalStatus.call(this, code)
  }

  next()
}

/**
 * 响应日志中间件
 */
export function responseLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now()

  // 响应完成后的日志
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.slice(0, 50),
    }

    // 根据状态码使用不同的日志级别
    if (res.statusCode >= 500) {
      console.error('[API Error]', JSON.stringify(logData))
    } else if (res.statusCode >= 400) {
      console.warn('[API Warning]', JSON.stringify(logData))
    } else {
      console.log('[API]', JSON.stringify(logData))
    }
  })

  next()
}

/**
 * 请求日志中间件
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)

  // 打印请求体（排除敏感信息）
  if (Object.keys(req.body || {}).length > 0) {
    const sanitizedBody = sanitizeBody(req.body)
    console.log('  Body:', JSON.stringify(sanitizedBody).slice(0, 500))
  }

  next()
}

/**
 * 清理请求体中的敏感信息
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization']
  const sanitized: Record<string, unknown> = {}

  for (const key of Object.keys(body)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '***REDACTED***'
    } else {
      sanitized[key] = body[key]
    }
  }

  return sanitized
}

/**
 * CORS 配置中间件
 */
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 允许的来源（生产环境应该配置具体域名）
  res.setHeader('Access-Control-Allow-Origin', '*')

  // 允许的方法
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )

  // 允许的头部
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )

  // 允许携带凭证
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // 缓存预检请求结果
  res.setHeader('Access-Control-Max-Age', '86400')

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  next()
}

/**
 * 统一响应格式中间件
 */
export function responseFormat(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json

  res.json = function(body: unknown) {
    // 如果已经有统一格式，直接返回
    if (body && typeof body === 'object' && ('success' in body || 'code' in body)) {
      return originalJson.call(this, body)
    }

    // 包装为统一格式
    const formatted = {
      success: res.statusCode >= 200 && res.statusCode < 300,
      data: body,
      timestamp: Date.now(),
    }

    return originalJson.call(this, formatted)
  }

  next()
}
