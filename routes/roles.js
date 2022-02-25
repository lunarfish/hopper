const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');

module.exports = {

  get: {
    index: (req, res) => {
      let template_data = common.template_data(req);
      console.log(template_data);

      Role.find()
        .then(roles => {
          template_data.roles = roles;
          console.log(template_data);
          res.render('roles', template_data)
        })
        .catch(err => res.status(500).json({msg: 'Crap!', err: err}));
        //.catch(err => res.redirect('/error'));
    },
    role: (req, res) => {

      let template_data = common.template_data(req);
      const user = Role.findOne({uuid: req.params.role_id})
      .then(user => {
        template_data.role = role;
        template_data.crumbs.push({url: '/role', name: 'Roles'});
        return template_data;
      })
      .then(template_data => res.render('role', template_data))
      .catch(err => res.json(err));
    }
  },
  post: {
    add: (req, res) => {
      console.log(req.body);
      const role = new Role({
        role_name: req.body.role_name
      });

      role
        .save()
        .then(user => res.redirect('/role/' + user.uuid))
        .catch(err => res.status(500).json({msg: 'Crap!', err: err}));
    }
  }
}
