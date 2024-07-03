const ApiError = require('../../helpers/ApiError')
const bcrypt = require('bcrypt')
const { generateToken } = require('../../helpers/token')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')
const { ObjectId } = require('mongodb')

module.exports = function ({ config, database }) {
  const resourcesCollection = database.resourcesCollection
  console.log(resourcesCollection)
  return {
    retrievePermissionGroups: async function () {
      try {
        const permissionGroups = await resourcesCollection.find({}).toArray()
        return permissionGroups
      } catch (err) {
        throw err
      }
    }
  }
}
