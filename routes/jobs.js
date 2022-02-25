const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const tenor = require('../services/tenor');
const Hopper = require('../models/Hopper');
const Stream = require('../models/Stream');
const {
  Job: Job,
  HopperJob: HopperJob,
  findJob: findJob,
  moveJob: moveJob
} = require('../models/Job');

module.exports = {
  get: {
    by_uuid: (req,res) => {
      let template_data = common.template_data(req);

      console.log("/job/[id]");
      findJob(req.params.job_id)
      .then(job => {
        template_data.job = job;
        template_data.crumbs.push({ url: "/hopper/" + job.hopper.slug, name: job.hopper.name });
        return template_data;
      })
      .then(template_data => {
        if (template_data.job.tenor_gif_id) {
          return tenor.get_by_id(template_data.job.tenor_gif_id)
          .then(gif_url => {
            template_data.gif_url = gif_url;
            return template_data;
          })
        } else {
          return template_data;
        }
      })
      .then(template_data => {
        console.log(template_data);
        return res.render('job', template_data);
      })
      .catch(err => {
        console.log("Not found in " + collection.name);
      });
    },
    hopper_job: (req, res) => {
      let template_data = common.template_data(req);
      const ThisHopperJob = HopperJob(req.params.hopper_name);

      const job = ThisHopperJob.findOne({uuid:req.params.job_id})
      .populate("hopper")
      .then(job => {
        template_data.job = job;
        template_data.crumbs.push(
            { url: "/hopper/" + job.hopper.slug, name: job.hopper.name }
        );
        return template_data;
      })
      .then(template_data => {
        if (template_data.job.tenor_gif_id) {
          return tenor.get_by_id(template_data.job.tenor_gif_id)
          .then(gif_url => {
            template_data.gif_url = gif_url;
            return template_data;
          })
        } else {
          return template_data;
        }
      })
      .then(template_data => {
        console.log(template_data);
        return res.render('job', template_data);
      })
      .catch(err => res.status(500).json({error: err}));
    },
    move: (req, res) => {
      let template_data = common.template_data(req);

      const ThisHopperJob = HopperJob(req.params.hopper_name);
      const job = ThisHopperJob.findOne({uuid:req.params.job_id})
      .populate("hopper")
      .then(job => {
        template_data.job = job;
        template_data.crumbs.push({ url: "/hopper/" + job.hopper.slug, name: job.hopper.name });
        template_data.crumbs.push({ url: "/hopper/" + job.hopper.slug + '/job/' + job.uuid, name: job.name});
        return template_data;
      })
      .then(template_data => {
        return Stream.find({upstream: template_data.job.hopper.id})
        .populate("downstream")
        .then(downstream => {
          console.log(downstream);
          template_data.downstream = downstream;
          return template_data
        });
      })
      .then(template_data => {
        let exclude = template_data.downstream.map(stream => {
          return stream.downstream._id;
        });
        exclude.push(template_data.job.hopper._id);
        return Hopper.find({ _id: { $not: { $in: exclude }}})
        .then(hoppers => {
          template_data.hoppers = hoppers;
          return template_data;
        })
      })
      .then(template_data => {
        console.log(template_data);
        return res.render('job_move', template_data);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({error: err})
      });
    }
  },
  post: {
    add: (req, res) => {
      console.log(req.body);
      const hopper = Hopper.findOne({name:new RegExp(req.params.hopper_name.replace('-','.'), 'i')})
      .then(hopper => {
        console.log(hopper.uuid);
        const ThisHopperJob = HopperJob(hopper.slug);
        const job = new ThisHopperJob({
          name: req.body.name,
          hopper: hopper._id
        });
        console.log(hopper);
        return job;
      })
      .then(job => {
        console.log(job);
        job
        .save()
        .then(job => {
          console.log("Saved: " + job.uuid);
        })
        .catch(err => res.status(500).json({error: err}));
        return job;
      })
      .then(job => {
        return res.redirect('/hopper/' + req.params.hopper_name);
      });
    },
    hopper_job: (req, res) => {
      console.log(req.body);
      const ThisHopperJob = HopperJob(req.params.hopper_name);
      ThisHopperJob.findOne({uuid:req.params.job_id})
      .populate("hopper")
      .then(job => {
        for (const [key, value] of Object.entries(req.body)) {
          job[key] = value;
        }
        console.log(job);
        return job.save();
      })
      .then(job => {
        res.redirect('/hopper/' + job.hopper.slug + '/job/' + job.uuid);
      })
      .catch(err => {
        console.log("Failed to update job");
        console.log(err);
      });
    },
    gif: (req, res) => {
      const ThisHopperJob = HopperJob(req.params.hopper_name);

      const job = ThisHopperJob.findOne({uuid:req.params.job_id})
      .then(job => {
        job.tenor_gif_id = req.body.gif_id;
        return job.save();
      })
      .then(job => res.redirect('/hopper/' + req.params.hopper_name + '/job/' + req.params.job_id))
      .catch(err => res.status(500).json({error: err}));
    },
    move: (req, res) => {
      console.log("/job/move");
      const job_id = req.params.job_id;
      const target_hopper_id = req.body.target_hopper_id;
      moveJob(job_id, target_hopper_id)
      .then(interim => {
        let hopper_name = interim.target.slug;
        return res.redirect('/hopper/' + hopper_name + '/job/' + interim.job.uuid);
      });
    }
  }
}
