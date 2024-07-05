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

  // // Define services
  const UserServices = require('./services/UserServices')({
    database
  })

  const AuthServices = require('./services/AuthServices')({
    database
  })

  const SubjectServices = require('./services/SubjectServices')({
    database
  })

  const PermissionAndResourceServices =
    require('./services/PermissionAndResourceServices')({
      database
    })

  container.register({
    repository: asValue({
      UserServices,
      AuthServices,
      SubjectServices,
      PermissionAndResourceServices
    }),
    database: asValue(database)
  })

  return container
}

const getDatabase = async (configurations) => {
  const container = await container(configurations)
  return container.resolve('database')
}

module.exports = {
  container,
  databaseAsync,
  getDatabase
}
