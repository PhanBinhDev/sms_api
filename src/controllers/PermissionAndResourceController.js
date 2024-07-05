const { createController } = require('awilix-express')
const ApiError = require('../helpers/ApiError')
const { StatusCodes } = require('http-status-codes')
const {
  validateCreateResource,
  validateUpdateResource,
  validateAssignResource,
  validateRemoveResource
} = require('../validations/accessControlListValidation')
const {
  checkPermission,
  isAuthenticated
} = require('../infrastructure/middlewares/authMiddleware')
function ResourceController({ repository }) {
  const PermissionAndResourceServices = repository.PermissionAndResourceServices
  return {
    // API Manage Permission
    retrievePermissionGroups: async (req, res, next) => {
      try {
        const result =
          await PermissionAndResourceServices.retrievePermissionGroups()
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        const { message, statusCode } = new Error(err)
        next(new ApiError(statusCode, message))
      }
    },
    updatePermissionGroupById: async (req, res, next) => {
      try {
        const { id } = req.params
        const data = {
          _id: id,
          ...req.body
        }
        const result =
          await PermissionAndResourceServices.updatePermissionGroupById(data)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    getPermissionGroupById: async (req, res, next) => {
      try {
        const { id } = req.params
        const result =
          await PermissionAndResourceServices.getPermissionGroupById(id)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },

    // API Manage Resource
    createResource: async (req, res, next) => {
      try {
        const result = await PermissionAndResourceServices.createResource(
          req.body
        )
        res.status(StatusCodes.CREATED).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    getResources: async (req, res, next) => {
      try {
        const result = await PermissionAndResourceServices.getResources()
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    getResourceById: async (req, res, next) => {
      try {
        const { id } = req.params
        const result = await PermissionAndResourceServices.getResourceById(id)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    updateResourceById: async (req, res, next) => {
      try {
        const { id } = req.params
        const data = {
          _id: id,
          ...req.body
        }
        const result = await PermissionAndResourceServices.updateResourceById(
          data
        )
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    deleteResource: async (req, res, next) => {
      try {
        const { id } = req.params
        const result = await PermissionAndResourceServices.deleteResource(id)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },

    // API manage assign resource
    assignResource: async (req, res, next) => {
      try {
        // Gán 1 resource cho 1 nhóm quyền nào đó
        // Kiểm tra xem resource đó đã được gán cho nhóm quyền đó chưa
        // Nếu đã gán thì báo lỗi
        // Nếu chưa gán thì gán
        // Cập nhật lại database
        // cần truyền lên 2 _id là _id của resource và _id nhóm quyền

        const result = await PermissionAndResourceServices.assignResource(
          req.body
        )
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    getInfoPermissionGroupResource: async (req, res, next) => {
      try {
        const { id } = req.params
        const result =
          await PermissionAndResourceServices.getInfoPermissionGroupResource(id)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    },
    removeResource: async (req, res, next) => {
      try {
        const result = await PermissionAndResourceServices.removeResource(
          req.body
        )
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(err.statusCode, new Error(err).message))
      }
    }
  }
}

module.exports = createController(ResourceController)
  .prefix('/api/v1/acl/')
  // API Manage Permission Group
  .before(
    [isAuthenticated, checkPermission] // check quyền truy cập trước khi gọi các API này
  )
  .get('permission-groups', 'retrievePermissionGroups')
  .get('permission-group/:id', 'getPermissionGroupById')
  .patch('permission-group/:id', 'updatePermissionGroupById')
  // API Manage Resource
  .post('resource', 'createResource', {
    before: [validateCreateResource]
  })
  .get('resources', 'getResources')
  .get('resource/:id', 'getResourceById')
  .patch('resource/:id', 'updateResourceById', {
    before: [validateUpdateResource]
  })
  .delete('resource/:id', 'deleteResource')
  // API Manage Assign Resource
  .post('assign-resource', 'assignResource', {
    before: [validateAssignResource] // Validate dữ liệu trước khi gán resource cho nhóm quyền
  })
  // API Get info Permission Group Resource
  .get('permission-group-resource/:id', 'getInfoPermissionGroupResource')
  // API Remove Resource
  .delete('remove-resource', 'removeResource', {
    before: [checkPermission, validateRemoveResource] // Validate dữ liệu trước khi xoá resource
  })
