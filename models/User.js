const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  joined: {
    type: Date,
    default: Date.now
  }
});

UserSchema
.virtual('full_name')
.get(function () {
  return this.first_name + ' ' + this.last_name;
});


UserSchema
.virtual('slug')
.get(function () {
  return (this.first_name + '-' + this.last_name).toLowerCase();
});


module.exports = User = mongoose.model('user', UserSchema);
