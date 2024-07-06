const { StatusCodes } = require('http-status-codes')
const ApiError = require('../../helpers/ApiError')
const jwt = require('jsonwebtoken')
const PermissionAndResourceServices = require('../services/PermissionAndResourceServices')
const container = require('../../infrastructure/container')

module.exports = {
  isAuthenticated: (req, res, next) => {
    const accessToken = req.cookies?.accessToken
    if (!accessToken) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Unauthorized (Token not found)'
      )
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
      req.user = decoded
      next()
    } catch (err) {
      if (err.message?.includes('jwt expired')) {
        return res.status(StatusCodes.GONE).json({
          message: 'Token expired. Need to refresh token'
        })
      }

      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Unauthorized (Invalid token). Please login'
      })
    }
  },
  checkPermission: async (req, res, next) => {
    const repository = (await container).resolve('repository')
    const permissionAndResourceServices =
      await repository.PermissionAndResourceServices
    const { group_id } = req.user ?? {}
    const originalUrl = req.originalUrl
    const resource = originalUrl.split('/api/v1')[1]
    const method = req.method.toUpperCase()
    const result =
      await permissionAndResourceServices.getInfoPermissionGroupResource(
        group_id
      )
    const hasPermission = result.resources.some(
      (item) => resource.startsWith(item.url) && item.method === method
    )
    if (!hasPermission) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Forbidden (You do not have permission to access this resource)'
      )
    }
    next()
  }
}
