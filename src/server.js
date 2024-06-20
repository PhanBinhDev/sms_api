const http = require('http')

async function main() {
  try {
    const { app, config } = await require('./startup.js')(
      require('./config.js')
    )

    const port = config.app.port
    http.createServer(app).listen(port, () => {
      console.log(`Listening port: ${port}`)
    })
  } catch (e) {
    console.error(e)
  }
}

main()
