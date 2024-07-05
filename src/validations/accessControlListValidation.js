const Joi = require('joi')
const ApiError = require('../helpers/ApiError')
const { StatusCodes } = require('http-status-codes')

const schemaCreateResource = Joi.object({
  url: Joi.string().required().messages({
    'string.empty': 'URL của tài nguyên không được để trống',
    'any.required': 'URL của tài nguyên là bắt buộc'
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Mô tả của tài nguyên không được để trống',
    'any.required': 'Mô tả của tài nguyên là bắt buộc'
  }),
  method: Joi.string()
    .required()
    .valid(
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'HEAD',
      'OPTIONS',
      'CONNECT',
      'TRACE'
    )
    .messages({
      'string.empty': 'Phương thức HTTP không được để trống',
      'any.required': 'Phương thức HTTP là bắt buộc',
      'string.pattern.base': 'Phương thức HTTP không hợp lệ'
    })
})
const schemaUpdateResource = Joi.object({
  url: schemaCreateResource.extract('url').optional(),
  description: schemaCreateResource.extract('description').optional(),
  method: schemaCreateResource.extract('method').optional()
})

const schemaAssignResource = Joi.object({
  resource_id: Joi.string().required().messages({
    'string.empty': 'ID tài nguyên không được để trống',
    'any.required': 'ID tài nguyên là bắt buộc'
  }),
  group_id: Joi.string().required().messages({
    'string.empty': 'ID nhóm quyền không được để trống',
    'any.required': 'ID nhóm quyền là bắt buộc'
  })
})

const schemaRemoveResource = Joi.object({
  resource_id: schemaAssignResource.extract('resource_id').optional(),
  group_id: schemaAssignResource.extract('group_id').optional()
})

module.exports = {
  validateCreateResource: async (req, res, next) => {
    try {
      await schemaCreateResource.validateAsync(req.body, {
        abortEarly: false
      })
      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  },
  validateUpdateResource: async (req, res, next) => {
    try {
      await schemaUpdateResource.validateAsync(req.body, {
        abortEarly: false
      })
      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  },
  validateAssignResource: async (req, res, next) => {
    try {
      await schemaAssignResource.validateAsync(req.body, {
        abortEarly: false
      })
      next()
    } catch (error) {
      next(
        new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message)
      )
    }
  },
  validateRemoveResource: async (req, res, next) => {
    try {
      await schemaRemoveResource.validateAsync(req.body, {
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
