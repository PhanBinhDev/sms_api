const { MongoClient } = require('mongodb')

const connectDatabase = async (configurations) => {
  try {
    const client = new MongoClient(
      configurations.mongoDB.uri,
      configurations.mongoDB.options
    )
    await client.connect()

    const database = client.db(configurations.mongoDB.database) // Gán giá trị cho db
    return database
  } catch (e) {
    console.error('Error connecting to MongoDB:', e)
    throw e
  }
}

module.exports = {
  connectDatabase // Export hàm connectDatabase
}
