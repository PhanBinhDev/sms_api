const { createController } = require('awilix-express')
const { createUser } = require('../validations/userValidation')

function templateController({ repository }) {
  const templateServices = repository.templateServices

  return {
    create: async (req, res) => {},
    retrieve: async (req, res) => {},
    update: async (req, res) => {},
    delete: async (req, res) => {}
  }
}

module.exports = createController(templateController)
  .prefix('/api/v1/user')
  .post('/', 'create', {
    before: createUser
  })
  .get('/', 'retrieve')
  .patch('/:id', 'update')
  .delete('/:id', 'delete')
