const { createController } = require('awilix-express')
const { StatusCodes } = require('http-status-codes')
const ApiError = require('../helpers/ApiError')
const authMiddleware = require('../infrastructure/middlewares/authMiddleware')
const authValidation = require('../validations/authValidation')

function UserController({ repository }) {
  const UserServices = repository.UserServices

  return {
    getUserById: async (req, res, next) => {
      try {
        const { id } = req.params
        const result = await UserServices.getUserById(id)
        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    updateUserById: async (req, res, next) => {
      try {
        const { id } = req.params
        const data = req.body
        const result = await UserServices.updateUserById(id, data)
        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    getAllUsers: async (req, res, next) => {
      try {
        const result = await UserServices.getAllUsers()
        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    deleteUserById: async (req, res, next) => {
      try {
        const { id } = req.params
        const result = await UserServices.deleteUserById(id)
        return res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    }
  }
}

module.exports = createController(UserController)
  .prefix('/api/v1/user')
  .post('/', 'create')
  .get('/one/:id', 'getUserById', {
    before: [authMiddleware.isAuthenticated]
  })
  .get('/all', 'getAllUsers', {
    before: [authMiddleware.isAuthenticated]
  })
  .patch('/:id', 'updateUserById', {
    before: [authMiddleware.isAuthenticated, authValidation.validateUpdateUser]
  })
  .delete('/:id', 'deleteUserById')
