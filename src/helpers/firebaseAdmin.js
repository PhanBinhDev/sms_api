// firebase admin sdk
const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.cert(require('../serviceAccountKey.json'))
})

module.exports = { admin }
