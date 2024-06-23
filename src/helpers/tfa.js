const qrcode = require('qrcode')
const otplib = require('otplib')

const { authenticator } = otplib

// Tạo secret key ứng với từng user

const generateUniqueSecret = () => {
  return authenticator.generateSecret()
}

// Tạo mã OTP token
const generateOTPToken = (username, serviceName, secret) => {
  return authenticator.keyuri(username, serviceName, secret)
}

const verifyOTPToken = (token, secret) => {
  return authenticator.verify({ token, secret })
}

const generateQRCode = async (otpAuth) => {
  try {
    const QRCodeImageUrl = await qrcode.toDataURL(otpAuth)
    return `<img src='${QRCodeImageUrl}' alt='qr-code-img' />`
  } catch (error) {
    console.log('Could not generate QR code', error)
    return
  }
}

module.exports = {
  generateUniqueSecret,
  generateOTPToken,
  verifyOTPToken,
  generateQRCode
}
