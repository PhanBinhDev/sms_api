const { auth } = require('../config')
const jwt = require('jsonwebtoken')

module.exports = {
  generateToken: (payload, type) => {
    const secretKey =
      type === 'accessToken' ? auth.jwtSecret : auth.refreshTokenSecret
    const expiresIn =
      type === 'accessToken' ? auth.jwtExpiresIn : auth.refreshTokenExpiresIn
    return jwt.sign(payload, secretKey, {
      expiresIn
    })
  }
}
