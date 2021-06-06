const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const Team = require('../models/Team');


module.exports = {

  get: {
    index: (req, res) => {
      let template_data = common.template_data();
      console.log(template_data);

      Team.find()
      .then(teams => {
        template_data.teams = teams;
        res.render('teams', template_data)
      })
      .catch(err => res.redirect('/error'));
    },
    team: (req, res) => {
      let template_data = common.template_data();
      const query = {name:new RegExp(req.params.team_name.replace(/\-/g,'.'), 'i')};
      const team = Team.findOne(query)
      .then(team => {
        template_data.team = team;
        template_data.crumbs.push({url: '/team', name: 'Teams'});
        return template_data;
      })
      .then(template_data => res.render('team', template_data))
      .catch(err => res.json(err));
    }
  },
  post: {
    add: (req, res) => {
      console.log(req.body);
      const team = new Team({
        name: req.body.name,
      });
      console.log(team);

      team
        .save()
        .then(team => {
          console.log(team.slug);
          return res.redirect('/team/' + team.slug)
        })
        .catch(err => res.status(500).json({msg: 'Crap!'}));
    }
  }
}
