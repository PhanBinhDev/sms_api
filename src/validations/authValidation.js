const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const ApiError = require('../helpers/ApiError')
const { generateUniqueSecret } = require('../helpers/tfa')
const { checkCodeInUse } = require('../helpers/auth')

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

const schemaCreateUser = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .required()
    .messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc'
    }),
  phone: Joi.string()
    .required()
    .regex(/^\d{10,11}$/)
    .messages({
      'string.empty': 'Số điện thoại không được để trống',
      'any.required': 'Số điện thoại là bắt buộc',
      'string.pattern.base': 'Số điện thoại không hợp lệ' // Kiểm tra số điện thoại có 10 hoặc 11 chữ số
    }),
  full_name: Joi.string().required().messages({
    'string.empty': 'Họ và tên không được để trống',
    'any.required': 'Họ và tên là bắt buộc'
  }),
  age: Joi.number()
    .integer() // Kiểm tra tuổi là số nguyên
    .min(1) // Tuổi phải lớn hơn hoặc bằng 1
    .max(150) // Tuổi phải nhỏ hơn hoặc bằng 150
    .required()
    .messages({
      'number.base': 'Tuổi phải là số',
      'number.integer': 'Tuổi phải là số nguyên',
      'number.min': 'Tuổi phải lớn hơn hoặc bằng 1',
      'number.max': 'Tuổi phải nhỏ hơn hoặc bằng 150',
      'any.required': 'Tuổi là bắt buộc'
    }),
  gender: Joi.string()
    .valid('Nam', 'Nữ', 'Khác') // Kiểm tra giới tính hợp lệ
    .required()
    .messages({
      'string.empty': 'Giới tính không được để trống',
      'any.required': 'Giới tính là bắt buộc',
      'any.only': 'Giới tính không hợp lệ'
    }),
  address: Joi.string().required().messages({
    'string.empty': 'Địa chỉ không được để trống',
    'any.required': 'Địa chỉ là bắt buộc'
  }),
  date_of_birth: Joi.date().required().messages({
    'date.base': 'Ngày sinh phải là ngày hợp lệ',
    'any.required': 'Ngày sinh là bắt buộc'
  }),
  student_code: Joi.string()
    .required()
    .regex(/^(PH)\d{5}$/) // Kiểm tra mã sinh viên bắt đầu bằng "PH" và 5 chữ số
    .messages({
      'string.empty': 'Mã sinh viên không được để trống',
      'any.required': 'Mã sinh viên là bắt buộc',
      'string.pattern.base': 'Mã sinh viên không hợp lệ'
    })
    .external(async (student_code) => {
      const isCodeInUse = await checkCodeInUse(student_code)
      console.log(isCodeInUse)
      if (isCodeInUse) {
        throw new ApiError(StatusCodes.CONFLICT, 'Mã sinh viên đã tồn tại')
      }

      return student_code
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
    }),
  id_card: Joi.string()
    .required()
    .regex(/^\d{9,12}$/) // Kiểm tra số chứng minh nhân dân có 12 chữ số
    .messages({
      'string.empty': 'Số chứng minh nhân dân không được để trống',
      'any.required': 'Số chứng minh nhân dân là bắt buộc',
      'string.pattern.base': 'Số chứng minh nhân dân không hợp lệ'
    }),
  role: Joi.string()
    .valid('student', 'parent', 'teacher', 'admin')
    .required()
    .messages({
      'string.empty': 'Vai trò không được để trống',
      'any.required': 'Vai trò là bắt buộc',
      'any.only': 'Vai trò không hợp lệ'
    }),
  status: Joi.string()
    .valid('Pending', 'Active', 'Completed') // Kiểm tra trạng thái hợp lệ
    .required()
    .messages({
      'string.empty': 'Trạng thái không được để trống',
      'any.only': 'Trạng thái không hợp lệ',
      'any.required': 'Trạng thái là bắt buộc'
    }),
  created_at: Joi.date().default(new Date()),
  metadata: Joi.object({
    provider: Joi.string().valid('Google', 'Github').required().messages({
      'any.only': 'Provider không hợp lệ',
      'any.required': 'Provider là bắt buộc'
    }),
    provider_id: Joi.string().required(),
    display_name: Joi.string().required(),
    photo_url: Joi.string().required(),
    uid: Joi.string().required()
  }).default({}),
  TFA: Joi.object({
    secret: Joi.string().required().messages({
      'any.required': 'Secret là bắt buộc'
    }),
    enabled: Joi.boolean().default(false).required().messages({
      'any.required': 'Enabled là bắt buộc'
    })
  })
})

const schemaResetPassword = Joi.object({
  newPassword: Joi.string()
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
      await schemaSignInWithCredentials.validateAsync(req.body, {
        abortEarly: false
      })

      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  },
  validateCreateUser: async (req, res, next) => {
    try {
      await schemaCreateUser.validateAsync(req.body, {
        abortEarly: false
      })

      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  },
  validateResetPassword: async (req, res, next) => {
    try {
      await schemaResetPassword.validateAsync(
        {
          newPassword: req.body.newPassword
        },
        {
          abortEarly: false
        }
      )
      next()
    } catch (err) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(err).message)
      )
    }
  }
}
