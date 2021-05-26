const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const JobHistorySchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  job_uuid: {
    type: String,
    required: true
  },
  hopper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hopper",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = JobHistory = mongoose.model('job_history', JobHistorySchema);
