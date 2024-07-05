const { createController } = require('awilix-express')
const subjectValidation = require('../validations/subjectValidation')
const { StatusCodes } = require('http-status-codes')
const ApiError = require('../helpers/ApiError')

function SubjectController({ repository }) {
  const SubjectServices = repository.SubjectServices
  return {
    createSubject: async (req, res, next) => {
      try {
        const result = await SubjectServices.createSubject(req.body)
        res.status(StatusCodes.CREATED).json(result)
      } catch (err) {
        next(new ApiError(StatusCodes.BAD_REQUEST, new Error(err).message))
      }
    },
    retrieve: async (req, res, next) => {
      try {
        const { page = 1, limit = 10, ...query } = req.query

        const result = await SubjectServices.retrieveSubjects(
          query,
          parseInt(page),
          parseInt(limit)
        )

        const resJson = {
          subjects: result.subjects,
          totalPages: Math.ceil(result.totalSubjects / limit),
          totalSubjects: result.totalSubjects,
          currentPage: parseInt(page),
          pageSize: parseInt(limit)
        }
        res.status(StatusCodes.OK).json(resJson)
      } catch (err) {
        next(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            new Error(err).message
          )
        )
      }
    },
    retrieveById: async (req, res, next) => {
      try {
        const { id } = req.params
        const result = await SubjectServices.retrieveSubjectById(id)

        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            new Error(err).message
          )
        )
      }
    },
    updateSubject: async (req, res, next) => {
      try {
        const { id } = req.params
        if (Object.keys(req.body).length === 0) {
          throw new ApiError(StatusCodes.NO_CONTENT, 'Nothing to update')
        }
        const result = await SubjectServices.updateSubjectById(id, req.body)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(
          new ApiError(
            err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            new Error(err).message
          )
        )
      }
    },
    deleteSubjectById: async (req, res, next) => {
      try {
        const { id } = req.params
        if (!id) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'No subject id provided')
        }

        const result = await SubjectServices.deleteSubjectById(id)
        res.status(StatusCodes.OK).json(result)
      } catch (err) {
        next(
          new ApiError(
            err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            new Error(err).message
          )
        )
      }
    }
  }
}

// Need to add permission access control to routes
module.exports = createController(SubjectController)
  .prefix('/api/v1/subjects')
  // Check admin permissions to access method create the subject
  .post('/', 'createSubject', {
    before: [subjectValidation.validateCreateSubject]
  })
  .get('/', 'retrieve')
  .get('/:id', 'retrieveById')
  .patch('/:id', 'updateSubject', {
    before: [subjectValidation.validateUpdateSubject]
  })
  .delete('/:id', 'deleteSubjectById')
