const { v4: uuidv4 } = require('uuid');
const common = require('../services/common');
const Team = require('../models/Team');
const Member = require('../models/Member');
const User = require('../models/User');


module.exports = {

  get: {
    index: (req, res) => {
      let template_data = common.template_data(req);
      console.log(template_data);

      Team.find()
      .then(teams => {
        template_data.teams = teams;
        res.render('teams', template_data)
      })
      .catch(err => res.redirect('/error'));
    },
    team: (req, res) => {
      let template_data = common.template_data(req);
      const query = {name:new RegExp(req.params.team_name.replace(/\-/g,'.'), 'i')};
      const team = Team.findOne(query)
      .then(team => {
        template_data.team = team;
        template_data.crumbs.push({url: '/team', name: 'Teams'});
        return template_data;
      })
      .then(template_data => {
        return Member.find({team: template_data.team.id}).populate("user");
      })
      .then(members => {
        template_data.members = members;
        console.log(members);
        return template_data;
      })
      .then(template_data => {
         return Team.find({parent: template_data.team._id})
      })
      .then(children => {
        template_data.children = children
        let exclude = children.map(child => {
          return child._id;
        });
        exclude.push(template_data.team._id);
        return Team.find({ _id: { $not: { $in: exclude }}})
        .then(parent_candidates => {
          template_data.parent_candidates = parent_candidates;
          return template_data;
        })
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
    },
    member_add: (req, res) => {
      console.log(req.body.email);
      let member = {}
      const query = {name:new RegExp(req.params.team_name.replace(/\-/g,'.'), 'i')};
      const team = Team.findOne(query)
      .then(team => {
        member.team = team;
        return member
      })
      .then(member => {
        return User.findOne({email: req.body.email})
      })
      .then(user => {
        member.user = user;
        return new Member(member).save()
      })
      .then(member => {
        return res.redirect('/team/' + req.params.team_name);
      })
      .catch(err => res.status(500).json({msg: 'Crap!'}));
    }
  }
}
