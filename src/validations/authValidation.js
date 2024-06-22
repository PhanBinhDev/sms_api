const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const ApiError = require('../helpers/ApiError')

const schemaSignInWithCredentials = Joi.object({
  username: Joi.string()
    .required()
    .regex(/^(PH)\d{5}$/)
    .messages({
      'string.empty': 'Mã sinh viên không được để trống',
      'any.required': 'Mã sinh viên là bắt buộc',
      'string.pattern.base': 'Mã sinh viên không hợp lệ'
    }),
  password: Joi.string()
    .required()
    .min(6) // Tối thiểu 6 ký tự
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/) // Phải có ít nhất 1 chữ thường, 1 chữ hoa, 1 số
    .message({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là bắt buộc',
      'string.pattern.base':
        'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ thường, chữ hoa và số'
    })
})

module.exports = {
  validateSignInWithCredentials: async (req, res, next) => {
    try {
      console.log('run validate')
      await schemaSignInWithCredentials.validateAsync(req.body, {
        abortEarly: false
      })

      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  }
}
