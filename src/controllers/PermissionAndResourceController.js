const { createController } = require('awilix-express')
const ApiError = require('../helpers/ApiError')
const { StatusCodes } = require('http-status-codes')

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
    update: async (req, res) => {},
    delete: async (req, res) => {}
  }
}

module.exports = createController(ResourceController)
  .prefix('/api/v1/acl')
  .get('/permission-groups', 'retrievePermissionGroups')
  .patch('/:id', 'update')
  .delete('/:id', 'delete')
