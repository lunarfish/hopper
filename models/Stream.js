const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const any = require('promise.any');
const Schema = mongoose.Schema;

const StreamSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  upstream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hopper",
    required: true
  },
  downstream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hopper",
    required: true
  }
});

let Stream = mongoose.model('stream', StreamSchema);

module.exports = Stream;
