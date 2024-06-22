const { createController } = require('awilix-express')
const authValidations = require('../validations/authValidation')
const { StatusCodes } = require('http-status-codes')
const ApiError = require('../helpers/ApiError')
const authMiddleware = require('../infrastructure/middlewares/authMiddleware')
const _ = require('lodash')
const {
  getTokenFromCookies,
  verifyAccessTokenGoogleAuth
} = require('../helpers/auth')

function AuthController({ repository }) {
  const AuthServices = repository.AuthServices

  return {
    signInWithCredentials: async (req, res, next) => {
      try {
        console.log('run controller')
        let result = await AuthServices.loginWithCredentials(req.body)

        // Save accessToken to cookie
        res.cookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 1000 * 60 * 15
        })

        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 1000 * 60 * 60
        })

        result = _.omit(result, ['refreshToken'])

        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    signOut: async (req, res, next) => {
      try {
        const { _id } = req.user
        await AuthServices.signOut(_id)

        res.clearCookie('accessToken')
        return res.status(StatusCodes.OK).json({ message: 'Logged out' })
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    refreshToken: async (req, res, next) => {
      try {
        const refreshToken = getTokenFromCookies(req, 'refreshToken')
        if (!refreshToken) {
          throw new ApiError(
            StatusCodes.UNPROCESSABLE_ENTITY,
            'Refresh token not available'
          )
        }

        const result = await AuthServices.refreshToken(refreshToken)

        res.cookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 1000 * 60 * 15
        })

        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    connectGoogle: async (req, res, next) => {
      try {
        // Lấy token từ google
        const { accessToken } = req.body
        // const { _id } = req.user
        const _id = '666eb83164dcad67f0155c92'
        if (!accessToken) {
          throw new ApiError(
            StatusCodes.UNPROCESSABLE_ENTITY,
            'Token not available'
          )
        }

        const verifiedGoogle = await verifyAccessTokenGoogleAuth(accessToken)

        if (!verifiedGoogle) {
          throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Something went wrong')
        }

        // Pass verifiedToken sang services
        const result = await AuthServices.connectGoogle(_id, verifiedGoogle)

        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    disconnectGoogle: async (req, res, next) => {
      try {
        const { _id } = req.user
        const result = await AuthServices.disconnectGoogle(_id)

        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    }
  }
}

module.exports = createController(AuthController)
  .prefix('/api/v1/auth')
  .post('/sign-in', 'signInWithCredentials', {
    before: [authValidations.validateSignInWithCredentials]
  })
  .post('/sign-out', 'signOut', {
    before: [authMiddleware.isAuthenticated]
  })
  .post('/refresh-token', 'refreshToken')
  // Add auth middleware
  .post('/connect-google', 'connectGoogle')
  .post('/disconnect-google', 'disconnectGoogle', {
    before: [authMiddleware.isAuthenticated]
  })
