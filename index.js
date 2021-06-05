const express = require('express');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const tenor = require('./services/tenor');
const common = require('./services/common');

const app = express();

const Item = require('./models/Item');
const Hopper = require('./models/Hopper');
const Stream = require('./models/Stream');
const {
  Job: Job,
  HopperJob: HopperJob,
  findJob: findJob,
  moveJob: moveJob
} = require('./models/Job');

app.use('/assets', express.static(path.join(__dirname, 'assets')));
//app.set('view engine', 'ejs');
nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.set('view engine', 'njk');
app.set('json spaces', 2)


const mongoUri = 'mongodb://hopper:does%20this%20work@mongo:27017/hopper';

const dbRetryTime = 5000;
const port = 3000;

let db = mongoose.connection;
let connectWithRetry = function () {
  return mongoose.connect(mongoUri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    user: process.env.MONGO_USERNAME,
    pass: process.env.MONGO_PASSWORD
  })
  .then((handle) => {
     console.log("Connected");
  })
  .catch((err) => {
    setTimeout(() => {
  		console.log('DB connection failed. Will try again.');
  		connectWithRetry();
    }, dbRetryTime);
  });
};

connectWithRetry();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

db.on('connected', function () {


  // test routes
  app.get('/job/find', (req, res) => {
    console.log("/job/find");
    const job_id = "5121bfa9-d2d3-4aa5-bb87-d5b0a2599ef8";
    findJob(job_id)
    .then(job => {
      return res.json(job);
    });
  });

  // end of test routes
  app.get('/', (req, res) => {

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
  });

  app.get('/initialise', (req, res) => {
    const hopper = new Hopper({
      name: "Incoming Requests"
    });

    hopper
      .save()
      .then(hopper => res.redirect('/'))
      .catch(err => res.status(500).json({msg: 'Crap!'}));
  });

  app.post('/hopper/add', (req, res) => {
    console.log(req.body);
    const hopper = new Hopper({
      name: req.body.name
    });

    hopper
      .save()
      .then(hopper => res.redirect('/'))
      .catch(err => res.status(500).json({msg: 'Crap!'}));
  });

  app.get('/hopper/:hopper_name', (req, res) => {
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
  });

  app.get('/hopper/:hopper_name/stream', (req, res) => {

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
  });

  app.post('/hopper/:hopper_name/stream/add', (req, res) => {
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
  });

  app.post('/hopper/:hopper_name/job/add', (req, res) => {
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
  });

  app.post('/hopper/:hopper_name/job/:job_id', (req, res) => {
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
  });

  app.get('/hopper/:hopper_name/job/:job_id', (req, res) => {
    let template_data = common.template_data();
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
        console.log(template_data.job.tenor_gif_id);
        return tenor.get_by_id(template_data.job.tenor_gif_id)
        .then(gif_url => {
          console.log(template_data);
          console.log(gif_url);
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
  });

  app.post('/hopper/:hopper_name/job/:job_id/gif', (req, res) => {
    const ThisHopperJob = HopperJob(req.params.hopper_name);

    const job = ThisHopperJob.findOne({uuid:req.params.job_id})
    .then(job => {
      job.tenor_gif_id = req.body.gif_id;
      return job.save();
    })
    .then(job => res.redirect('/hopper/' + req.params.hopper_name + '/job/' + req.params.job_id))
    .catch(err => res.status(500).json({error: err}));
  });

  app.get('/hopper/:hopper_name/job/:job_id/move', (req, res) => {
    let template_data = common.template_data();

    const ThisHopperJob = HopperJob(req.params.hopper_name);
    const job = ThisHopperJob.findOne({uuid:req.params.job_id})
    .populate("hopper")

    .then(job => {
      template_data.job = job;
      template_data.push({ url: "/hopper/" + job.hopper.slug, name: job.hopper.name });
      template_data.push({ url: "/hopper/" + job.hopper.slug + '/job/' + job.uuid, name: job.name});
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
    .catch(err => res.status(500).json({error: err}));
  });

  app.post('/hopper/:hopper_name/job/:job_id/move', (req, res) => {
    console.log("/job/move");
    const job_id = req.params.job_id;
    const target_hopper_id = req.body.target_hopper_id;
    moveJob(job_id, target_hopper_id)
    .then(interim => {
      let hopper_name = interim.target.slug;
      return res.redirect('/hopper/' + hopper_name + '/job/' + interim.job.uuid);
    });
  });

  app.get('/job/:job_id', (req,res) => {
    let template_data = common.template_data();

    console.log("/job/[id]");
    findJob(req.params.job_id)
    .then(job => {
      template_data.job = job;
      template_data.crumbs.push({ url: "/hopper/" + job.hopper.slug, name: job.hopper.name });
      return template_data;
    })
    .then(template_data => {
      console.log(template_data);
      return res.render('job', template_data);
    })
    .catch(err => {
      console.log("Not found in " + collection.name);
    });
  });

  app.post('/gifs', (req, res) => {
    let template_data = common.template_data();
    const limit = 24;
    tenor.search(req.body.search_term, limit)
    .then(gifs => {
      template_data.search_term = req.body.search_term;
      template_data.next_path = req.body.next_path;
      template_data.gifs = gifs;
      return template_data;
    })
    .then(template_data => res.render('gifs', template_data))
    .catch(err => console.log(err));
  });

  app.listen(port, () => console.log('Server running...'));
});
