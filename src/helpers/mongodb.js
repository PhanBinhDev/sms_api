const { ObjectId } = require('mongodb')

const isValidObjectId = (id) => {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) {
      return true
    }
    return false
  }
  return false
}

module.exports = {
  isValidObjectId
}
