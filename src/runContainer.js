module.exports = (async () => {
  const container = await require('./infrastructure/container').container(
    require('./config')
  )
  return container
})()
