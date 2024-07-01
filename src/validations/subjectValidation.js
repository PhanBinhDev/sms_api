const Joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const ApiError = require('../helpers/ApiError')
const { checkCodeInUse } = require('../helpers/auth')

const schemaCreateSubject = Joi.object({
  subjectId: Joi.string()
    .required()
    .pattern(/^(SBJ)\d{5}$/)
    .messages({
      'string.empty': 'Mã môn học không được để trống',
      'any.required': 'Mã môn học là bắt buộc',
      'string.pattern.base': 'Mã môn học không hợp lệ' // Kiểm tra mã môn học có 6 chữ số
    })
    .external(async (subjectId) => {
      const isCodeInUse = await checkCodeInUse(
        subjectId,
        'subjectsCollection',
        'subjectId'
      )
      if (isCodeInUse) {
        throw new ApiError(StatusCodes.CONFLICT, 'Mã môn học đã tồn tại')
      }

      return subjectId
    }),
  name: Joi.string().required().min(3).max(100).messages({
    'string.empty': 'Tên môn học không được để trống',
    'any.required': 'Tên môn học là bắt buộc',
    'string.min': 'Tên môn học phải có ít nhất 3 ký tự',
    'string.max': 'Tên môn học phải có nhiều nhất 100 ký tự' // Kiểm tra tên môn học có ít nhất 3 và nhiều nhất 100 ký tự
  }),
  description: Joi.string().required().min(10).max(500).messages({
    'string.empty': 'Mô tả môn học không được để trống',
    'any.required': 'Mô tả môn học là bắt buộc',
    'string.min': 'Mô tả môn học phải có ít nhất 10 ký tự',
    'string.max': 'Mô tả môn học phải có nhiều nhất 500 ký tự' // Kiểm tra mô tả môn học có ít nhất 10 và nhiều nhất 500 ký tự
  }),
  startDate: Joi.date().required().messages({
    'date.base': 'Ngày bắt đầu môn học không hợp lệ',
    'any.required': 'Ngày bắt đầu môn học là bắt buộc' // Kiểm tra ngày bắt đầu môn học h��p lệ
  }),
  endDate: Joi.date().required().greater(Joi.ref('startDate')).messages({
    'date.base': 'Ngày kết thúc môn học không hợp lệ',
    'any.required': 'Ngày kết thúc môn học là bắt buộc', // Kiểm tra ngày kết thúc môn học h��p lệ
    'date.greater': 'Ngày kết thúc môn học phải lớn hơn ngày bắt đầu' // Kiểm tra ngày kết thúc môn học l��n hơn ngày bắt đầu môn học
  }),
  credit: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(5)
    .label('Số tín chỉ')
    .messages({
      'any.required': 'Số tín chỉ là bắt buộc',
      'number.integer': 'Số tín chỉ phải là số nguyên',
      'number.min': 'Số tín chỉ phải >= 1',
      'number.max': 'Số tín chỉ phải <= 5'
    }),
  teachers: Joi.array()
    .items(
      Joi.string().required().messages({
        'any.required': 'ID giáo viên là bắt buộc',
        'string.empty': 'ID giáo viên không được để trống'
      })
    )
    .required()
    .min(1)
    .messages({
      'array.min': 'Phải có ít nhất 1 giáo viên phụ trách',
      'array.items': 'ID giáo viên phải là chuỗi ký tự' // Kiểm tra ID giáo viên là chu��i ký tự
    }),
  department: Joi.string().required().messages({
    'any.required': 'ID khoa là bắt buộc',
    'string.empty': 'ID khoa không được để trống'
  }),
  semester: Joi.string()
    .required()
    .regex(/^(Summer|Spring|Fall)\s+\d{4}$/)
    .messages({
      'any.required': 'Kì học là bắt buộc',
      'string.empty': 'Kì học không được để trống',
      'string.base': 'Kì học phải là Summer, Spring hoặc Fall',
      'string.pattern.base':
        'Kì học phải có dạng Summer/Spring/Fall + năm (ví dụ: Summer 2023)'
    })
})

const schemaUpdateSubject = schemaCreateSubject.keys({
  subjectId: Joi.forbidden().error(() => {
    return new Error('Không được phép cập nhật mã môn học')
  }), // Không cho phép update mã môn học
  name: schemaCreateSubject.extract('name').optional(),
  description: schemaCreateSubject.extract('description').optional(),
  startDate: schemaCreateSubject.extract('startDate').optional(),
  endDate: schemaCreateSubject.extract('endDate').optional(),
  credit: schemaCreateSubject.extract('credit').optional(),
  teachers: schemaCreateSubject.extract('teachers').optional(),
  department: schemaCreateSubject.extract('department').optional(),
  semester: schemaCreateSubject.extract('semester').forbidden() // Không cho phép update kì học
})

module.exports = {
  validateCreateSubject: async (req, res, next) => {
    try {
      await schemaCreateSubject.validateAsync(req.body, {
        abortEarly: false
      })

      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  },
  validateUpdateSubject: async (req, res, next) => {
    try {
      await schemaUpdateSubject.validateAsync(req.body, {
        abortEarly: false
      })
      next()
    } catch (error) {
      console.log(error)
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  }
}
