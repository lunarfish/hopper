const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuidv4()
  },
  name: {
    type: String,
    required: true
  },
  author: {
    type: String
  },
  owner: {
    type: String
  },
  assignees: {
    type: [String]
  },
  reviewers: {
    type: [String]
  },
  date: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: Number,
    default: 100
  },
  hopper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "hopper",
    required: true
  },
  description: {
    type: String
  },
  tenor_gif_id: {
    type: String
  }
});

let HopperJob = function (hopper) {
  let collection = "hpr_" + hopper.replace(/\-/g,'_');
  console.log(collection);
  return mongoose.model(collection, JobSchema);
}

let Job = mongoose.model('job', JobSchema);

const findJob = function(job_id) {
  return mongoose.connection.db.listCollections()
  .toArray()
  .then(collections => {
     return Promise.all(collections.map(collection => {
       if (collection.name.match(/^hpr_/)) {
         console.log("Looking in " + collection.name);
         let hopper_slug = collection.name.replace(/^hpr_/, '').replace('_', '-');
         const ThisHopperJob = HopperJob(hopper_slug);
         return ThisHopperJob.findOne({uuid:job_id})
         .populate("hopper")
         .catch(err => null);
       } else {
         console.log("Not a hopper collection: " + collection.name);
         return false;
       }
     }))
     .then(resolves => {
       return resolves.reduce((found, job) => {
         return (job) ? job : found;
       });
     })
     .catch(err => {
       console.log("No job found");
       console.log(err);
     });
  })
  .catch(err => {
    console.log("Collection list error");
    console.log(err);
  });
}

const moveJob = function(job_id, hopper_id) {
  return findJob(job_id)
  .then(job => {
    return Hopper.findOne({uuid: hopper_id})
    .then(hopper => {
      return {
        job: job,
        target: hopper
      }
    })
    .catch(err => {
      console.log("Failed to resolve downstream")
      console.log(err);
    });
  })
  .then(interim => {
    const TargetHopperJob = HopperJob(interim.target.slug);
    let sourceHopper = interim.job.hopper;
    let movedJobData = interim.job.toJSON();
    delete movedJobData._id;
    movedJobData.hopper = interim.target.id;
    movedJobData.isNew = true;
    let movedJob = new TargetHopperJob(movedJobData);
    return movedJob.save()
    .then(job => {
      console.log("Saved new job")
      interim.newJob = job
      return interim;
    })
    .then(interim => {
      console.log("Delete old job");
      console.log(interim);
      const SourceHopperJob = HopperJob(interim.job.hopper.slug);
      return SourceHopperJob.remove({_id: interim.job.id})
      .then(status => {
        console.log("Deleted old job");
        interim.status = status;
        return interim;
      })
      .catch(err => {
        console.log("Failed to move");
        console.log(err);
      });
    })
    .catch(err => {
      console.log("Failed to save new job");
      console.log(err);
    });
  });
}

module.exports = {
  HopperJob: HopperJob,
  Job: Job,
  findJob: findJob,
  moveJob: moveJob
};
