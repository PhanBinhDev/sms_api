const bodyParser = require('body-parser')
const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { loadControllers, scopePerRequest } = require('awilix-express')
const errorHandlingMiddleware = require('./infrastructure/middlewares/errorHandling')
require('express-async-errors')
require('dotenv').config({
  path: __dirname + '/../.env'
})

module.exports = async (config) => {
  var app = express()
  app.use(helmet())
  app.use(cors(config.cors))
  app.use(cookieParser())
  app.use(bodyParser.json({ limit: '1mb' }))
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: false }))

  const container = await require('./infrastructure/container').container(
    config
  )

  app.use(scopePerRequest(container))
  app.use(loadControllers('./controllers/*Controller.js'))
  app.use(errorHandlingMiddleware)

  return {
    app,
    config
  }
}
