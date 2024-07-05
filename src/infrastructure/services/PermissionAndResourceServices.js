const ApiError = require('../../helpers/ApiError')
const bcrypt = require('bcrypt')
const { generateToken } = require('../../helpers/token')
const _ = require('lodash')
const { StatusCodes } = require('http-status-codes')
const { ObjectId, MongoErr } = require('mongodb')
const { isValidObjectId } = require('../../helpers/mongodb')
module.exports = function ({ config, database }) {
  const {
    resourcesCollection,
    permissionGroupsCollection,
    groupResourceCollection
  } = database
  return {
    // Handle Permission Groups
    retrievePermissionGroups: async function () {
      try {
        const permissionGroups = await permissionGroupsCollection
          .find()
          .toArray()
        return { message: 'success', data: permissionGroups }
      } catch (err) {
        throw err
      }
    },
    updatePermissionGroupById: async function (data) {
      try {
        if (!isValidObjectId(data._id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }
        const result = await permissionGroupsCollection.updateOne(
          { _id: new ObjectId(data._id) },
          { $set: _.omit(data, ['_id']) }
        )

        if (result.matchedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Permission group not found'
          )
        }

        if (result.modifiedCount === 0) {
          throw new ApiError(StatusCodes.NO_CONTENT, 'Nothing to update')
        }

        return {
          message: 'Updated permission group successfully'
        }
      } catch (err) {
        throw err
      }
    },
    getPermissionGroupById: async function (id) {
      try {
        if (!isValidObjectId(id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }
        const permissionGroup = await permissionGroupsCollection.findOne({
          _id: new ObjectId(id)
        })
        if (!permissionGroup) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            'Permission group not found'
          )
        }
        return { data: permissionGroup }
      } catch (err) {
        throw err
      }
    },

    // Handle Resource
    createResource: async function (data) {
      try {
        const newResource = await resourcesCollection.insertOne(data)

        if (newResource.insertedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Could not create resource'
          )
        }
        const idToAssign = newResource.insertedId
        // Get id group permission has name Admin to assign
        const adminGroup = await permissionGroupsCollection.findOne({
          name: 'Admin'
        })

        if (!adminGroup) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Admin group not found'
          )
        }
        // Assign resource to admin group

        await this.assignResource({
          resource_id: String(idToAssign),
          group_id: String(adminGroup._id)
        })
        return {
          assign: 'Resource assigned to group admin',
          message: 'Resource created successfully'
        }
      } catch (err) {
        throw err
      }
    },
    getResources: async function () {
      try {
        const resources = await resourcesCollection.find().toArray()
        return { message: 'success', data: resources }
      } catch (err) {
        throw err
      }
    },
    getResourceById: async function (id) {
      try {
        if (!isValidObjectId(id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }

        const resource = await resourcesCollection.findOne({
          _id: new ObjectId(id)
        })

        if (!resource) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found')
        }

        return { data: resource }
      } catch (err) {
        throw err
      }
    },
    updateResourceById: async function (data) {
      try {
        if (!isValidObjectId(data?._id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }
        const updatedCount = await resourcesCollection.updateOne(
          { _id: new ObjectId(data._id) },
          { $set: _.omit(data, ['_id']) }
        )

        if (updatedCount.modifiedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Could not update resource'
          )
        }

        return {
          message: 'Resource updated successfully'
        }
      } catch (err) {
        throw err
      }
    },
    deleteResource: async function (id) {
      try {
        if (!isValidObjectId(id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }
        const deletedCount = await resourcesCollection.deleteOne({
          _id: new ObjectId(id)
        })
        if (deletedCount.deletedCount === 0) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'Resource not found')
        }
        return {
          message: 'Resource deleted successfully'
        }
      } catch (err) {
        throw err
      }
    },
    assignResource: async function (data) {
      try {
        const { resource_id, group_id } = data
        if (!isValidObjectId(resource_id) || !isValidObjectId(group_id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }

        const permissionGroup = await permissionGroupsCollection.findOne({
          _id: new ObjectId(group_id)
        })
        if (!permissionGroup) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Permission group not found'
          )
        }

        const resource = await resourcesCollection.findOne({
          _id: new ObjectId(resource_id)
        })

        if (!resource) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Resource not found'
          )
        }

        const result = await groupResourceCollection.insertOne({
          group_id: new ObjectId(group_id),
          resource_id: new ObjectId(resource_id)
        })
        if (result.insertedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Could not assign resource'
          )
        }

        return {
          message: 'Resource assigned successfully'
        }
      } catch (err) {
        throw err
      }
    },
    getInfoPermissionGroupResource: async function (id) {
      try {
        // id -> group_id
        // Get info group
        if (!isValidObjectId(id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }

        const groupInfo = await permissionGroupsCollection.findOne({
          _id: new ObjectId(id)
        })

        // aggregate resources

        const resources = await groupResourceCollection
          .aggregate([
            {
              $match: { group_id: new ObjectId(id) }
            },
            {
              $lookup: {
                from: 'resourcesCollection',
                localField: 'resource_id',
                foreignField: '_id',
                as: 'resources'
              }
            },
            {
              $unwind: '$resources'
            },
            {
              $group: {
                _id: '$group_id',
                resources: { $push: '$resources' }
              }
            },
            {
              $project: {
                _id: 0,
                resources: 1
              }
            }
          ])
          .toArray()
        const result = {
          groupInfo: _.omit(groupInfo, ['_id']),
          resources: resources.length > 0 ? resources[0].resources : []
        }
        return result
      } catch (err) {
        throw err
      }
    },
    removeResource: async function (data) {
      try {
        const { resource_id, group_id } = data
        if (!isValidObjectId(resource_id) || !isValidObjectId(group_id)) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid id')
        }
        const result = await groupResourceCollection.deleteOne({
          group_id: new ObjectId(group_id),
          resource_id: new ObjectId(resource_id)
        })
        if (result.deletedCount === 0) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Could not remove resource'
          )
        }
        return {
          message: 'Resource removed successfully'
        }
      } catch (err) {
        throw err
      }
    }
  }
}
