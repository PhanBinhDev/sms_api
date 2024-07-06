const bodyParser = require('body-parser')
const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { rateLimit } = require('express-rate-limit')
const { loadControllers, scopePerRequest } = require('awilix-express')
const errorHandlingMiddleware = require('./infrastructure/middlewares/errorHandling')
require('express-async-errors')
require('dotenv').config({
  path: __dirname + '/../.env'
})

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  statusCode: 429
})

module.exports = async (config) => {
  var app = express()
  app.use(helmet())
  app.use(cors(config.cors))
  app.use(cookieParser())
  app.use(bodyParser.json({ limit: '1mb' }))
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: false }))
  app.use(limiter)
  const container = await require('./infrastructure/container')
  app.use(scopePerRequest(container))
  app.use(loadControllers('./controllers/*Controller.js'))
  app.use(errorHandlingMiddleware)

  return {
    app,
    config
  }
}
