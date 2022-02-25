const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  role_name: {
    type: String,
    required: true
  }
});

RoleSchema
.virtual('slug')
.get(function () {
  return this.role_name.toLowerCase().replace(/[\s_]+/g, '-');
});

module.exports = Role = mongoose.model('role', RoleSchema);
