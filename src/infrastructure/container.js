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
      templatesCollection: database.collection('templatesCollection')
    }
  }
}

const database = new Database(require('../config'))

const container = async (configurations) => {
  const container = createContainer()
  // Register database
  container.register({
    database: asFunction(async () => {
      const db = new Database(configurations)
      return await db.connect()
    }).singleton()
  })

  // // Define services

  const TemplateServices = require('./services/TemplateServices')({
    database: await container.resolve('database')
  })

  const AuthServices = require('./services/AuthServices')({
    database: await container.resolve('database')
  })

  container.register({
    repository: asValue({
      TemplateServices,
      AuthServices
    })
  })

  return container
}

module.exports = {
  container,
  database
}
