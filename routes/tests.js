const {
  findJob: findJob,
} = require('../models/Job');

module.exports = {
  get: {
    job_find: (req, res) => {
      console.log("/job/find");
      const job_id = "5121bfa9-d2d3-4aa5-bb87-d5b0a2599ef8";
      findJob(job_id)
      .then(job => {
        return res.json(job);
      });
    }
  },
  post: {

  }
}
