const common = require('../services/common');
const tenor = require('../services/tenor');

module.exports = {

  get: {
  },
  post: {
    search: (req, res) => {
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
    }
  }
}
