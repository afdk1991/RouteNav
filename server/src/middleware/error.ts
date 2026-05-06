import type { Request, Response, NextFunction } from 'express'

/**
 * 自定义错误类型
 */
export class AppError extends Error {
  statusCode: number
  code?: string

  constructor(statusCode: number, message: string, code?: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

/**
 * 404 处理
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由 ${req.method} ${req.path} 不存在`,
    },
  })
}

/**
 * 全局错误处理
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 打印错误日志
  console.error('[Error]', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  })

  // 处理自定义错误
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message,
      },
    })
    return
  }

  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: '认证失败，请重新登录',
      },
    })
    return
  }

  // 处理数据库错误
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '数据库操作失败',
      },
    })
    return
  }

  // 默认错误响应
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : '服务器内部错误，请稍后重试',
    },
  })
}

/**
 * 异步处理器包装
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
