const { StatusCodes } = require('http-status-codes')
const _ = require('lodash')
const { ObjectId } = require('mongodb')
const ApiError = require('../../helpers/ApiError')

module.exports = function ({ config, database }) {
  const subjectsCollection = database.subjectsCollection
  return {
    createSubject: async function (data) {
      try {
        const { insertedCount } = await database.subjectsCollection.insertOne(
          data
        )

        if (insertedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Could not create subject'
          )
        }

        return {
          message: 'Created subject successfully'
        }
      } catch (err) {
        throw err
      }
    },
    retrieveSubjects: async function (query, page, limit) {
      try {
        const searchQuery = {}
        if (query.subjectId) {
          searchQuery.subjectId = query.subjectId
        }

        if (query.name) {
          searchQuery.name = { $regex: new RegExp(query.name, 'i') }
        }

        if (query.credit) {
          searchQuery.credit = parseInt(query.credit)
        }

        if (query.department) {
          searchQuery.department = query.department
        }

        if (query.semester) {
          searchQuery.semester = query.semester
        }

        const subjects = await subjectsCollection
          .find(searchQuery)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray()

        const totalSubjects = await subjectsCollection.countDocuments(
          searchQuery
        )
        return { subjects, totalSubjects }
      } catch (err) {
        throw err
      }
    },

    retrieveSubjectById: async function (id) {
      try {
        const subject = await subjectsCollection.findOne({
          _id: new ObjectId(id)
        })

        if (!subject) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Subject not found')
        }

        return { subject }
      } catch (err) {
        throw err
      }
    },
    updateSubjectById: async function (id, data) {
      try {
        const updatedCount = await subjectsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: data }
        )

        if (updatedCount.modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Could not update subject'
          )
        }

        return {
          message: 'Updated subject successfully'
        }
      } catch (err) {
        throw err
      }
    },
    deleteSubjectById: async function (id) {
      try {
        const deleteCount = await subjectsCollection.deleteOne({
          _id: new ObjectId(id)
        })

        if (deleteCount.deletedCount === 0) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Subject not found')
        }

        return {
          message: 'Deleted subject successfully'
        }
      } catch (err) {
        throw err
      }
    },
    searchSubjects: async function (query, page, limit = 10) {
      try {
        const startIndex = (page - 1) * limit
        const subjects = await subjectsCollection
          .find(query)
          .skip(startIndex)
          .limit(limit)
          .toArray()

        const totalCount = await subjectsCollection.countDocuments(query)
        const hasMore = totalCount > startIndex + limit

        return { subjects, hasMore }
      } catch (err) {
        throw err
      }
    }
    // Additional methods for filtering, sorting, pagination, etc. can be added here
  }
}
