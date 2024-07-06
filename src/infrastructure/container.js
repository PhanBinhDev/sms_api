const { asValue, createContainer } = require('awilix')
const { MongoClient } = require('mongodb')

const container = async (configurations) => {
  const container = createContainer()

  const client = await MongoClient.connect(configurations.mongoDB.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  // Define db name with config
  const initDB = client.db(configurations.mongoDB.database)

  try {
    await initDB.command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } catch (e) {
    console.error('Error pinging MongoDB:', e)
  }

  // Define collection
  const database = {
    client,
    database: initDB,
    usersCollection: initDB.collection('usersCollection'),
    subjectsCollection: initDB.collection('subjectsCollection'),
    resourcesCollection: initDB.collection('resourcesCollection'),
    permissionGroupsCollection: initDB.collection('permissionGroupsCollection'),
    groupResourceCollection: initDB.collection('groupResourceCollection')
  }

  container.register({
    repository: asValue({
      UserServices: require('./services/UserServices'),
      AuthServices: require('./services/AuthServices'),
      SubjectServices: require('./services/SubjectServices'),
      PermissionAndResourceServices: require('./services/PermissionAndResourceServices')
    }),
    database: asValue(database)
  })

  return container
}

module.exports = (async () => {
  return await container(require('../config'))
})()
