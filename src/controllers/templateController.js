const { createController } = require('awilix-express')

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
  .prefix('/api/template')
  .post('/', 'create')
  .get('/', 'retrieve')
  .patch('/:id', 'update')
  .delete('/:id', 'delete')
