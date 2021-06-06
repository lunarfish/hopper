const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const Hopper = require('../models/Hopper');
const {
  Job: Job,
  HopperJob: HopperJob,
  findJob: findJob,
  moveJob: moveJob
} = require('../models/Job');

module.exports = {
  get: {
    index: (req, res) => {

      let template_data = common.template_data();
      console.log(template_data);

      Hopper.find()
        .then(hoppers => {
           if (hoppers.length == 0) res.redirect('/initialise')
           else return hoppers;
        })
        .then(hoppers => {
          template_data.hoppers = hoppers;
          res.render('index', template_data)
        })
        .catch(err => res.redirect('/initialise'));
    },
    initialise: (req, res) => {
      const hopper = new Hopper({
        name: "Incoming Requests"
      });

      hopper
        .save()
        .then(hopper => res.redirect('/'))
        .catch(err => res.status(500).json({msg: 'Crap!'}));
    },
    hopper: (req, res) => {
      let template_data = common.template_data();
      const query = {name:new RegExp(req.params.hopper_name.replace(/\-/g,'.'), 'i')};
      console.log(query);

      const hopper = Hopper.findOne(query)
      .then(hopper => {
        console.log("Find collection schema for: " + hopper.slug);

        const ThisHopperJob = HopperJob(hopper.slug);
        console.log("Find hopper jobs");
        return ThisHopperJob.find()
        .then(jobs => {
          console.log(jobs);
          template_data.hopper = hopper;
          template_data.hopper_status = "low";
          template_data.jobs = jobs;

          return template_data;
        });
      })
      .then(template_data => res.render('hopper', template_data))
      .catch(err => res.json(err));
    },
    stream: (req, res) => {

      let template_data = common.template_data();
      const hopper = Hopper.findOne({name:new RegExp(req.params.hopper_name.replace('-','.'), 'i')})
      .then(hopper => {
        return Stream.find({upstream: hopper.id})
        .populate("downstream")
        .then(downstream => {
          console.log(downstream);
          template_data.hopper = hopper;
          template_data.downstream = downstream;
          template_data.crumbs.push({ url: "/hopper" + hopper.slug, name: hopper.name });
          return template_data;
        });
      })
      .then(template_data => {
        let exclude = template_data.downstream.map(stream => {
          return stream.downstream._id;
        });
        exclude.push(template_data.hopper._id);

        return Hopper.find({ _id: { $not: { $in: exclude }}})
        .then(hoppers => {
          template_data.hoppers = hoppers;
          console.log(template_data);
          return template_data;
        })
      })
      .then(template_data => res.render('stream', template_data))
      .catch(err => res.json({
        error:err
      }));
    }
  },
  post: {
    add: (req, res) => {
      console.log(req.body);
      const hopper = new Hopper({
        name: req.body.name
      });

      hopper
        .save()
        .then(hopper => res.redirect('/'))
        .catch(err => res.status(500).json({msg: 'Crap!'}));
    },
    stream_add: (req, res) => {
      const hopper = Hopper.findOne({name:new RegExp(req.params.hopper_name.replace('-','.'), 'i')})
      .then(hopper => {
        const stream = new Stream({
          upstream: hopper.id,
          downstream: req.body.add_downstream
        })
        return stream;
      })
      .then(stream => {
        stream
          .save()
          .then(stream => {
            console.log("Saved: " + stream.uuid);
          })
          .catch(err => res.status(500).json({error: err}));
        return stream;
      })
      .then(job => {
        return res.redirect('/hopper/' + req.params.hopper_name + '/stream');
      });
    }
  }
}
