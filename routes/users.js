const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const User = require('../models/User');


module.exports = {

  get: {
    users: (req, res) => {
      let template_data = common.template_data();
      console.log(template_data);

      User.find()
        .then(users => {
          template_data.users = users;
          res.render('users', template_data)
        })
        .catch(err => res.redirect('/error'));
    }
  }
}
