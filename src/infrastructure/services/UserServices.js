const { StatusCodes } = require('http-status-codes')
const _ = require('lodash')
const { ObjectId } = require('mongodb')
const ApiError = require('../../helpers/ApiError')

module.exports = function ({ config, database }) {
  const usersCollection = database.usersCollection
  return {
    getAllUsers: async function () {
      try {
        const users = await usersCollection.find({}).toArray()
        const result = _.map(users, (user) => {
          return _.omit(user, ['password', 'refresh_token', 'TFA'])
        })

        return {
          users: result
        }
      } catch (err) {
        throw err
      }
    },
    getUserById: async function (_id) {
      try {
        const user = await usersCollection.findOne({ _id: new ObjectId(_id) })
        const result = _.omit(user, ['password', 'refresh_token', 'TFA'])

        return result
      } catch (err) {
        throw err
      }
    },
    updateUserById: async function (_id, data) {
      try {
        const updateUser = await usersCollection.updateOne(
          { _id: new ObjectId(_id) },
          {
            $set: data
          }
        )

        if (updateUser.modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong!'
          )
        }

        return {
          message: 'Updated user successfully'
        }
      } catch (err) {
        throw err
      }
    },
    deleteUserById: async function (_id) {
      try {
        const deleteUser = await usersCollection.deleteOne({
          _id: new ObjectId(_id)
        })

        if (deleteUser.deletedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Something went wrong!'
          )
        }

        return {
          message: 'Deleted user successfully'
        }
      } catch (err) {
        throw err
      }
    }
  }
}
