const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const UserRoleSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "role",
    required: true
  },

});

module.exports = UserRole = mongoose.model('user_role', UserRoleSchema);
