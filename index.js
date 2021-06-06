const express = require('express');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// services
const tenor = require('./services/tenor');
const common = require('./services/common');

// routes
const routes_hoppers = require('./routes/hoppers');
const routes_jobs = require('./routes/jobs');
const routes_users = require('./routes/users');
const routes_teams = require('./routes/teams');
const routes_tenor = require('./routes/tenor');
const routes_tests = require('./routes/tests');

const app = express();

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
  app.get('/job/find', routes_tests.get.job_find);

  // end of test routes
  app.get('/', routes_hoppers.get.index);

  app.get('/initialise', routes_hoppers.get.initialise);

  app.post('/hopper/add', routes_hoppers.post.add);

  app.get('/hopper/:hopper_name', routes_hoppers.get.hopper);

  app.get('/hopper/:hopper_name/stream', routes_hoppers.get.stream);

  app.post('/hopper/:hopper_name/stream/add', routes_hoppers.post.stream_add);

  app.post('/hopper/:hopper_name/job/add', routes_jobs.post.add);

  app.post('/hopper/:hopper_name/job/:job_id', routes_jobs.post.hopper_job);

  app.get('/hopper/:hopper_name/job/:job_id', routes_jobs.get.hopper_job);

  app.post('/hopper/:hopper_name/job/:job_id/gif', routes_jobs.post.gif);

  app.get('/hopper/:hopper_name/job/:job_id/move', routes_jobs.get.move);

  app.post('/hopper/:hopper_name/job/:job_id/move', routes_jobs.post.move);

  app.get('/job/:job_id', routes_jobs.get.by_uuid);

  app.post('/gifs', routes_tenor.post.search);

  // Users
  app.get('/user', routes_users.get.index);
  app.post('/user/add', routes_users.post.add);
  app.get('/user/:user_id', routes_users.get.user);

  // teams
  app.get('/team', routes_teams.get.index);
  app.post('/team/add', routes_teams.post.add);
  app.get('/team/:team_name', routes_teams.get.team);

  app.listen(port, () => console.log('Server running...'));
});
