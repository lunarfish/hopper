const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const MemberSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "team",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Member = mongoose.model('member', MemberSchema);
