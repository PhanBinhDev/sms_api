const ApiError = require('../../helpers/ApiError')
const bcrypt = require('bcrypt')
const { generateToken } = require('../../helpers/token')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')
const { ObjectId } = require('mongodb')
const { verifyToken } = require('../../helpers/auth')

module.exports = function ({ config, database }) {
  const usersCollection = database.usersCollection
  return {
    loginWithCredentials: async function (data) {
      try {
        console.log('run services')

        const { username, password } = data

        const query = {
          student_code: { $regex: username, $options: 'i' }
        }

        const user = await usersCollection.findOne(query)
        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }

        // Compare password
        const matchingPassword = await bcrypt.compare(password, user.password)

        if (!matchingPassword) {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect')
        }

        const payload = {
          _id: user._id,
          email: user.email,
          student_code: user.student_code,
          full_name: user.full_name,
          metadata: user?.metadata ?? {}
        }

        const accessToken = generateToken(payload, 'accessToken')
        const refreshToken = generateToken(payload, 'refreshToken')

        // Call Update User By ID
        const updatedUser = await usersCollection.updateOne(
          {
            _id: user._id
          },
          {
            $set: {
              last_sign_in_date: new Date(),
              refresh_token: refreshToken
            }
          }
        )

        if (updatedUser.modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong. Please try again later'
          )
        }

        return {
          userInfo: payload,
          accessToken,
          refreshToken
        }
      } catch (err) {
        throw err
      }
    },
    signOut: async function (_id) {
      try {
        const updateUser = await usersCollection.updateOne(
          { _id: new ObjectId(_id) },
          {
            $unset: {
              refresh_token: 1
            }
          }
        )
        if (updateUser.modifiedCount === 0) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }

        return {
          message: 'Signed out Successfully'
        }
      } catch (err) {
        throw err
      }
    },
    refreshToken: async function (refreshToken) {
      try {
        const user = await usersCollection.findOne({
          refresh_token: refreshToken
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid RefreshToken')
        }

        const verified = verifyToken(refreshToken, 'refreshToken')

        console.log(verified)
        if (!verified) {
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            'Invalid refreshToken or has been expired'
          )
        }

        const payload = {
          _id: user._id,
          email: user.email,
          student_code: user.student_code,
          full_name: user.full_name,
          metadata: user?.metadata ?? {}
        }

        const accessToken = generateToken(payload, 'accessToken')

        return {
          accessToken
        }
      } catch (err) {
        throw err
      }
    },
    connectGoogle: async function (_id, dataGoogle) {
      try {
        const { provider_id, display_name, uid, photo_url, email } = dataGoogle
        const user = await usersCollection.findOne({
          _id: new ObjectId(_id)
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }

        const existConnect = await usersCollection.findOne({
          'metadata.uid': uid
        })

        if (existConnect) {
          return {
            message: 'Already connected'
          }
        }

        // Check matched email
        const matchingEmailConnect = await usersCollection.findOne({
          email
        })

        if (!matchingEmailConnect) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Email not matched')
        }

        const metadata = {
          provider: 'Google',
          provider_id,
          display_name,
          photo_url,
          uid
        }
        const updateUser = await usersCollection.updateOne(
          {
            _id: new ObjectId(_id)
          },
          {
            $set: {
              metadata,
              updated_at: new Date()
            }
          }
        )

        if (updateUser.modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong. Please try again later'
          )
        }

        return {
          message: 'Connected Successfully'
        }
      } catch (err) {
        throw err
      }
    },
    disconnectGoogle: async function (_id) {
      try {
        const updatedUser = await usersCollection.updateOne(
          {
            _id: new ObjectId(_id)
          },
          {
            $unset: {
              metadata: 1
            }
          }
        )

        if (updatedUser.modifiedCount === 0) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Something went wrong.')
        }

        return {
          message: 'Disconnected Successfully'
        }
      } catch (err) {
        throw err
      }
    }
  }
}
