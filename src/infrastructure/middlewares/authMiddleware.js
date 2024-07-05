const { StatusCodes } = require('http-status-codes')
const ApiError = require('../../helpers/ApiError')
const jwt = require('jsonwebtoken')
const PermissionAndResourceServices = require('../services/PermissionAndResourceServices')
const container = require('../../runContainer')

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
        res.status(StatusCodes.GONE).json({
          message: 'Token expired. Need to refresh token'
        })
      }

      res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Unauthorized (Invalid token). Please login'
      })
    }
  },
  checkPermission: async (req, res, next) => {
    const database = (await container).resolve('database')
    const services = PermissionAndResourceServices({
      database
    })
    const { group_id } = req.user ?? {}
    const originalUrl = req.originalUrl
    const resource = originalUrl.split('/api/v1')[1]
    const method = req.method.toUpperCase()
    const result = await services.getInfoPermissionGroupResource(group_id)
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
