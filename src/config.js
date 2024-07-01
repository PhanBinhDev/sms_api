const env = process.env

const allowedOrigins = ['http://localhost:5173']
const config = {
  app: {
    port: parseInt(env.PORT, 10) || 3000,
    appName: env.APP_NAME || 'SMS',
    env: env.NODE_ENV || 'development'
  },
  mongoDB: {
    uri:
      env.MONGODB_URL ||
      'mongodb+srv://binhphandev:g543Mgb7U1gxwpvX@clustersms.ssss7cv.mongodb.net/',
    database: env.DATABASE || 'sampleDB',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  auth: {
    jwtSecret: env.JWT_SECRET || 'Zm2NGpWELsQAD1xsJzGQpYfvICSsFkEpU0jxBjfd',
    jwtExpiresIn: env.JWT_EXPIRES_IN || '1h',
    saltRounds: env.SALT_ROUND || 10,
    refreshTokenSecret:
      env.REFRESH_TOKEN_SECRET || 'VmVyeVBvd2VyZnVsbFNlY3JldA==',
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN || '2h'
  },
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        return callback(
          new ApiError(
            StatusCodes.FORBIDDEN,
            `${origin} not allowed by our CORS Policy.`
          )
        )
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400
  }
}

module.exports = config
