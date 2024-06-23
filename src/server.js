const http = require('http')

async function main() {
  try {
    const { app, config } = await require('./startup.js')(
      require('./config.js')
    )

    const port = config.app.port
    http.createServer(app).listen(port, () => {
      if (!process.env.RESEND_API_KEY) {
        throw `Abort: You need to define RESEND_API_KEY in the .env file.`
      }
      console.log(`Listening port: ${port}`)
    })
  } catch (e) {
    console.error(e)
  }
}

main()
