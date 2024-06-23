const { StatusCodes } = require('http-status-codes')
const ApiError = require('../../helpers/ApiError')
const jwt = require('jsonwebtoken')

module.exports = {
  isAuthenticated: (req, res, next) => {
    const accessToken = req.cookies?.accessToken
    if (!accessToken) {
      throw new ApiError(
        StatusCodes.NON_AUTHORITATIVE_INFORMATION,
        'No access token found'
      )
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
      req.user = decoded
      next()
    } catch (err) {
      // console.log(err)
      next(new ApiError(StatusCodes.UNAUTHORIZED, new Error(err).message))
    }
  }
}
