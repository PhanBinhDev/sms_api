const { asValue, asFunction, createContainer } = require('awilix')
const { MongoClient } = require('mongodb')
class Database {
  constructor(configurations) {
    this.configurations = configurations
  }

  async connect() {
    const client = new MongoClient(
      this.configurations.mongoDB.uri,
      this.configurations.mongoDB.options
    )
    await client.connect()
    const database = client.db(this.configurations.mongoDB.database)

    // Ping database
    try {
      await database.command({ ping: 1 })
      console.log(
        'Pinged your deployment. You successfully connected to MongoDB!'
      )
    } catch (e) {
      console.error('Error pinging MongoDB:', e)
    }

    // Disconnect mongoDB when app exits
    process.on('exit', async () => {
      await client.close()
      console.log('Disconnected from MongoDB')
    })

    return {
      client,
      database,
      usersCollection: database.collection('usersCollection'),
      // Save subjects collection
      subjectsCollection: database.collection('subjectsCollection'),

      // Save url path
      resourcesCollection: database.collection('resourcesCollection'),
      // Save group permissions like admin, members...
      permissionGroupsCollection: database.collection(
        'permissionGroupsCollection'
      ),
      // Save permission group and resource relationship
      groupResourceCollection: database.collection('groupResourceCollection')
    }
  }
}

const databaseAsync = async (configurations) => {
  try {
    const initDB = new Database(configurations)
    return await initDB.connect()
  } catch (e) {
    throw e
  }
}

const container = async (configurations) => {
  const container = createContainer()
  // Register database
  container.register({
    database: asFunction(async () => {
      return await databaseAsync(configurations)
    }).singleton()
  })

  // // Define services
  const UserServices = require('./services/UserServices')({
    database: await container.resolve('database')
  })

  const AuthServices = require('./services/AuthServices')({
    database: await container.resolve('database')
  })

  const SubjectServices = require('./services/SubjectServices')({
    database: await container.resolve('database')
  })

  container.register({
    repository: asValue({
      UserServices,
      AuthServices,
      SubjectServices
    })
  })

  return container
}

module.exports = {
  container,
  databaseAsync
}
