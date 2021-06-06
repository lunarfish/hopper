const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const User = require('../models/User');


module.exports = {

  get: {
    index: (req, res) => {
      let template_data = common.template_data();
      console.log(template_data);

      User.find()
        .then(users => {
          template_data.users = users;
          res.render('users', template_data)
        })
        .catch(err => res.redirect('/error'));
    },
    user: (req, res) => {

      let template_data = common.template_data();
      const user = User.findOne({uuid: req.params.user_id})
      .then(user => {
        template_data.user = user;
        template_data.crumbs.push({url: '/user', name: 'Users'});
        return template_data;
      })
      .then(template_data => res.render('user', template_data))
      .catch(err => res.json(err));
    }
  },
  post: {
    add: (req, res) => {
      console.log(req.body);
      const user = new User({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email
      });

      user
        .save()
        .then(user => res.redirect('/user/' + user.uuid))
        .catch(err => res.status(500).json({msg: 'Crap!'}));
    }
  }
}
