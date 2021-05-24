const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const HopperSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  owner: {
    type: String
  },
  members: {
    type: [String]
  },
  admins: {
    type: [String]
  },
  public: {
    type: Boolean,
    default: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

HopperSchema
.virtual('slug')
.get(function () {
  return this.name.toLowerCase().replace(/\s+/g, '-');
});

module.exports = Hopper = mongoose.model('hopper', HopperSchema);
