const ApiError = require('../../helpers/ApiError')
const bcrypt = require('bcrypt')
const { generateToken } = require('../../helpers/token')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')
const { ObjectId } = require('mongodb')
const resend = require('../../helpers/resend')
const { verifyToken } = require('../../helpers/auth')
const {
  generateUniqueSecret,
  generateOTPToken,
  generateQRCode,
  verifyOTPToken
} = require('../../helpers/tfa')
const saltRounds = 10

module.exports = function ({ config, database }) {
  const usersCollection = database.usersCollection
  return {
    register: async function (data) {
      data.metadata = {}
      data.password = await bcrypt.hash(data.password, saltRounds)
      data.TFA = {
        enabled: false,
        secret: ''
      }
      const { insertedCount } = await usersCollection.insertOne(data)

      if (insertedCount === 0) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Could not register user'
        )
      }

      return {
        message: 'Created user successfully'
      }
    },
    loginWithCredentials: async function (data) {
      try {
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

        if (user?.TFA?.enabled) {
          // handle response to user know need to verify TFA
          const temporaryPayload = {
            _id: user._id,
            email: user.email
          }

          return {
            isTFAEnabled: true,
            temporaryToken: generateToken(temporaryPayload, 'accessToken', {
              expiresIn: '5m'
            }),
            message: 'Need to verify TFA'
          }
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
          isTFAEnabled: false,
          userInfo: payload,
          accessToken,
          refreshToken
        }
      } catch (err) {
        console.log(err)
        throw err
      }
    },
    loginWithGoogle: async function (dataGoogle) {
      try {
        const { uid } = dataGoogle
        const user = await usersCollection.findOne({
          'metadata.uid': uid
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
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
    },
    enableTFA: async function (_id) {
      try {
        const user = await usersCollection.findOne({
          _id: new ObjectId(_id)
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }

        const serviceName = `FPOLY_SMS_${user.student_code}`
        const secret = generateUniqueSecret()

        const { modifiedCount } = await usersCollection.updateOne(
          { _id: new ObjectId(_id) },
          { $set: { 'TFA.secret': secret, 'TFA.enabled': false } }
        )

        console.log('modifiedCount', modifiedCount)

        if (modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong. Please try again later'
          )
        }
        const otpAuth = generateOTPToken(user.full_name, serviceName, secret)

        const QRCodeImage = await generateQRCode(otpAuth)

        return {
          QRCodeImage
        }
      } catch (err) {
        throw err
      }
    },
    verifyTFA: async function (_id, otpToken, type) {
      try {
        const user = await usersCollection.findOne({
          _id: new ObjectId(_id)
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }
        const isValid = verifyOTPToken(otpToken, user.TFA.secret)

        if (!isValid) {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid OTP Token')
        }

        // type for enable or disable
        const updateObj = {
          'TFA.enabled': type === 'enable'
        }

        if (type === 'disable') {
          updateObj['$unset'] = {
            'TFA.secret': true
          }
        }

        const { modifiedCount } = await usersCollection.updateOne(
          {
            _id: new ObjectId(_id)
          },
          {
            $set: updateObj
          }
        )

        if (modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong. Please try again later'
          )
        }
        return {
          message:
            type === 'enable'
              ? 'Enabled TFA Successfully'
              : 'Disabled TFA Successfully'
        }
      } catch (err) {
        throw err
      }
    },
    verifyTFASignIn: async function (temporaryToken, otp) {
      try {
        // verify temporary token
        const verified = verifyToken(temporaryToken, 'accessToken')
        if (!verified) {
          // Case need to Re Login and verify TFA
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            'Invalid temporary token or has been expired'
          )
        }

        // verify TFA

        const user = await usersCollection.findOne({
          _id: new ObjectId(verified._id)
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }

        const isValid = verifyOTPToken(otp, user.TFA.secret)

        if (!isValid) {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid OTP Token')
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
          isTFAEnabled: true,
          userInfo: payload,
          accessToken,
          refreshToken
        }
      } catch (err) {
        throw err
      }
    },
    forgotPassword: async function (email) {
      try {
        const user = await usersCollection.findOne({
          email
        })

        if (!user) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Could not find user')
        }
        // generate token

        const payload = {
          _id: user._id,
          email: user.email,
          student_code: user.student_code
        }

        const token = generateToken(payload, 'accessToken')

        // save token
        await usersCollection.updateOne(
          {
            _id: new ObjectId(user._id)
          },
          {
            $set: {
              reset_password_token: token
            }
          }
        )

        const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
        // Use resend to send mail reset password

        const { data, error } = await resend.emails.send({
          from: 'team@binh-dev.io.vn',
          to: user.email,
          subject: 'Forgot Password',
          html: `
            <head>
              <style>
                h1 {
                  color: red;
                }
                p {
                  font-size: 16px;
                  line-height: 1.5;
                }
                a {
                  color: blue;
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <h1>Reset Password</h1>
              <p>Please click the link below to reset your password</p>
              <a href="${url}">Click Here</a>
            </body>
          `
        })

        if (error) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong. Please try again later'
          )
        }

        return {
          message: 'Email sent successfully'
        }
      } catch (err) {
        throw err
      }
    },
    resetPassword: async function (token, newPassword) {
      try {
        const verified = verifyToken(token, 'accessToken')

        if (!verified) {
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            'This link invalid or has been expired'
          )
        }
        const user = await usersCollection.findOne({
          reset_password_token: token
        })

        if (!user) {
          throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token')
        }

        const { modifiedCount } = await usersCollection.updateOne(
          {
            reset_password_token: token
          },
          {
            $set: {
              password: await bcrypt.hash(newPassword, saltRounds)
            },
            $unset: {
              reset_password_token: 1
            }
          }
        )

        if (modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong. Please try again later'
          )
        }

        return {
          message: 'Reset password successfully'
        }
      } catch (err) {
        throw err
      }
    }
  }
}
