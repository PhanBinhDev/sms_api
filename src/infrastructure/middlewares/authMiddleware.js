const { StatusCodes } = require('http-status-codes')
const ApiError = require('../../helpers/ApiError')
const jwt = require('jsonwebtoken')

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
  }
}
