const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const config = require('../config')
const { admin } = require('./firebaseAdmin')
const { databaseAsync } = require('../infrastructure/container')
function getTokenFromCookies(req, key) {
  if (!key) key = ''

  if (req.cookies && req.cookies[key]) {
    // Trả về Access Token từ cookie
    return req.cookies[key]
  }
  return null
}

function verifyToken(token, type) {
  try {
    const decoded = jwt.verify(
      token,
      type === 'accessToken'
        ? config.auth.jwtSecret
        : config.auth.refreshTokenSecret
    )

    // Check time expires and valid token
    if (decoded.exp < Date.now() / 1000) {
      return false
    }

    return decoded
  } catch (err) {
    throw err
  }
}

function comparePassword(password, passwordHash) {
  try {
    return bcrypt.compare(password, passwordHash)
  } catch (err) {
    throw err
  }
}

async function verifyAccessTokenGoogleAuth(accessToken) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(accessToken)
    return {
      display_name: decodedToken.name,
      email: decodedToken.email,
      photo_url: decodedToken.picture,
      provider_id: decodedToken.firebase.sign_in_provider,
      uid: decodedToken.uid
    }
  } catch (err) {
    throw err
  }
}

async function checkCodeInUse(code, collectionName, fieldName) {
  try {
    const database = await databaseAsync(require('../config'))
    const collection = database[collectionName]

    // Kiểm tra xem fieldName có tồn tại và code đã tồn tại hay chưa trong một lần findOne()
    const existDocument = await collection.findOne(
      { [fieldName]: code },
      { projection: { [fieldName]: 1 } }
    )

    // Kiểm tra xem fieldName có tồn tại hay không
    if (existDocument === null) {
      throw new Error(
        `Field "${fieldName}" not found in the "${collectionName}"`
      )
    }

    // Kiểm tra xem code đã tồn tại hay chưa
    if (existDocument) {
      return true
    }
    return false
  } catch (err) {
    throw err
  }
}

module.exports = {
  getTokenFromCookies,
  verifyToken,
  comparePassword,
  verifyAccessTokenGoogleAuth,
  checkCodeInUse
}
