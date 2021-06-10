const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const TeamSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  name: {
    type: String,
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "team",
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

TeamSchema
.virtual('slug')
.get(function () {
  return this.name.toLowerCase().replace(/\s+/g, '-');
});


module.exports = Team = mongoose.model('team', TeamSchema);
